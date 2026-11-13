"""
SERVIDOR (equipo que se va a controlar).

Ejecútalo en el equipo al que te quieres conectar (Windows o macOS):

    python servidor.py                       # genera una contraseña aleatoria
    python servidor.py --contrasena MiClave  # usa una contraseña fija

Comparte la pantalla y recibe ratón/teclado del cliente.
"""

import argparse
import io
import platform
import secrets
import socket
import sys
import threading
import time

# En Windows hay que declarar "DPI awareness" ANTES de capturar la pantalla,
# para que las coordenadas de la captura y del ratón coincidan con escalado
# 125 %, 150 %, etc.
if sys.platform == "win32":
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass

import mss
from PIL import Image
from pynput.keyboard import Controller as Teclado, Key, KeyCode
from pynput.mouse import Button, Controller as Raton

import protocolo as p

try:
    import pyperclip
except ImportError:  # el portapapeles es opcional
    pyperclip = None


SO = {"win32": "windows", "darwin": "mac"}.get(sys.platform, "linux")

# Teclas especiales: nombre "keysym" de Tk -> tecla de pynput
TECLAS_ESPECIALES = {
    "Return": Key.enter, "KP_Enter": Key.enter, "BackSpace": Key.backspace,
    "Tab": Key.tab, "ISO_Left_Tab": Key.tab, "Escape": Key.esc,
    "Delete": Key.delete, "space": Key.space,
    "Shift_L": Key.shift, "Shift_R": Key.shift_r,
    "Control_L": Key.ctrl, "Control_R": Key.ctrl_r,
    "Alt_L": Key.alt, "Alt_R": Key.alt_r, "Option_L": Key.alt, "Option_R": Key.alt_r,
    "Meta_L": Key.cmd, "Meta_R": Key.cmd_r, "Super_L": Key.cmd, "Super_R": Key.cmd_r,
    "Win_L": Key.cmd, "Win_R": Key.cmd_r, "Command": Key.cmd,
    "Caps_Lock": Key.caps_lock,
    "Up": Key.up, "Down": Key.down, "Left": Key.left, "Right": Key.right,
    "Home": Key.home, "End": Key.end, "Prior": Key.page_up, "Next": Key.page_down,
    **{f"F{i}": getattr(Key, f"f{i}") for i in range(1, 21) if hasattr(Key, f"f{i}")},
}
for _nombre, _attr in [("Insert", "insert"), ("Print", "print_screen"),
                       ("Pause", "pause"), ("Num_Lock", "num_lock"),
                       ("Scroll_Lock", "scroll_lock"), ("Menu", "menu")]:
    if hasattr(Key, _attr):
        TECLAS_ESPECIALES[_nombre] = getattr(Key, _attr)

# Signos de puntuación (útil cuando se pulsan junto con Ctrl/Cmd)
PUNTUACION = {
    "comma": ",", "period": ".", "minus": "-", "plus": "+", "equal": "=",
    "slash": "/", "backslash": "\\", "semicolon": ";", "apostrophe": "'",
    "bracketleft": "[", "bracketright": "]", "grave": "`", "quoteleft": "`",
    "less": "<", "greater": ">", "question": "?", "exclam": "!",
    "numbersign": "#", "dollar": "$", "percent": "%", "ampersand": "&",
    "asterisk": "*", "parenleft": "(", "parenright": ")", "colon": ":",
    "underscore": "_", "quotedbl": '"', "at": "@", "asciitilde": "~",
    "asciicircum": "^", "bar": "|", "braceleft": "{", "braceright": "}",
    "ntilde": "ñ", "Ntilde": "Ñ",
}

# Compatibilidad con versiones nuevas (mss.MSS) y antiguas (mss.mss) de mss
abrir_captura = getattr(mss, "MSS", None) or mss.mss

BOTONES = {"izq": Button.left, "der": Button.right, "med": Button.middle}


def ips_locales():
    """Devuelve (ip_principal, otras_ips).

    La principal es la de la tarjeta de red que sale a Internet (Wi-Fi o
    cable). Las otras suelen ser adaptadores virtuales (VirtualBox, VPN...).
    """
    principal = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # no envía datos, solo elige la interfaz
        principal = s.getsockname()[0]
        s.close()
    except OSError:
        pass
    otras = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            otras.add(info[4][0])
    except OSError:
        pass
    otras -= {"127.0.0.1", principal}
    otras = sorted(otras)
    if principal is None:
        principal = otras.pop(0) if otras else "127.0.0.1"
    return principal, otras


class Sesion:
    """Atiende a un cliente conectado."""

    def __init__(self, conn, args):
        self.conn = conn
        self.args = args
        self.activo = True
        self.raton = Raton()
        self.teclado = Teclado()
        self.pulsadas = set()
        self.lock_envio = threading.Lock()
        self.monitor = None

    def enviar(self, tipo, datos=b""):
        with self.lock_envio:
            p.enviar(self.conn, tipo, datos)

    # ------------------------------------------------------------------ captura
    def bucle_pantalla(self):
        intervalo = 1.0 / max(1, self.args.fps)
        ultimo = None
        with abrir_captura() as sct:
            monitores = sct.monitors
            indice = self.args.monitor if self.args.monitor < len(monitores) else 1
            self.monitor = monitores[indice]
            while self.activo:
                inicio = time.monotonic()
                captura = sct.grab(self.monitor)
                crudo = captura.bgra
                # Solo enviar si la pantalla cambió (ahorra mucho ancho de banda)
                firma = hash(crudo[::97])
                if firma != ultimo:
                    ultimo = firma
                    img = Image.frombuffer("RGB", captura.size, crudo, "raw", "BGRX")
                    if img.width > self.args.ancho_max:
                        alto = round(img.height * self.args.ancho_max / img.width)
                        img = img.resize((self.args.ancho_max, alto), Image.BILINEAR)
                    buf = io.BytesIO()
                    img.save(buf, "JPEG", quality=self.args.calidad)
                    try:
                        self.enviar(p.MSG_IMAGEN, buf.getvalue())
                    except OSError:
                        self.activo = False
                        break
                espera = intervalo - (time.monotonic() - inicio)
                if espera > 0:
                    time.sleep(espera)

    # ------------------------------------------------------------------ entrada
    def a_pantalla(self, nx, ny):
        m = self.monitor
        x = m["left"] + min(max(nx, 0.0), 1.0) * (m["width"] - 1)
        y = m["top"] + min(max(ny, 0.0), 1.0) * (m["height"] - 1)
        return int(round(x)), int(round(y))

    def tecla(self, ev):
        nombre, car = ev.get("k", ""), ev.get("c", "")
        if nombre in TECLAS_ESPECIALES:
            return TECLAS_ESPECIALES[nombre]
        if len(nombre) == 1:
            return KeyCode.from_char(nombre)
        if nombre in PUNTUACION:
            return KeyCode.from_char(PUNTUACION[nombre])
        if nombre.startswith("KP_") and len(nombre) == 4:
            return KeyCode.from_char(nombre[3])
        if car and car.isprintable():
            return KeyCode.from_char(car)
        return None

    def aplicar(self, ev):
        t = ev.get("t")
        if self.monitor is None:
            return
        if t == "mover":
            self.raton.position = self.a_pantalla(ev["x"], ev["y"])
        elif t in ("bajar", "subir"):
            self.raton.position = self.a_pantalla(ev["x"], ev["y"])
            boton = BOTONES.get(ev.get("b"), Button.left)
            (self.raton.press if t == "bajar" else self.raton.release)(boton)
        elif t == "rueda":
            self.raton.scroll(ev.get("dx", 0), ev.get("dy", 0))
        elif t == "tecla_bajar":
            k = self.tecla(ev)
            if k is not None:
                self.teclado.press(k)
                self.pulsadas.add(k)
        elif t == "tecla_subir":
            k = self.tecla(ev)
            if k is not None:
                self.teclado.release(k)
                self.pulsadas.discard(k)
        elif t == "soltar_todo":
            self.soltar_todo()

    def soltar_todo(self):
        for k in list(self.pulsadas):
            try:
                self.teclado.release(k)
            except Exception:
                pass
        self.pulsadas.clear()

    # ------------------------------------------------------------------ sesión
    def autenticar(self):
        nonce = p.nuevo_nonce()
        p.enviar(self.conn, p.MSG_HOLA, {"version": p.VERSION, "so": SO,
                                         "equipo": socket.gethostname(), "nonce": nonce})
        self.conn.settimeout(30)
        tipo, datos = p.recibir(self.conn)
        self.conn.settimeout(None)
        if tipo != p.MSG_AUTH or not p.respuesta_valida(
                self.args.contrasena, nonce, p.a_json(datos).get("hmac", "")):
            time.sleep(2)  # frena intentos de fuerza bruta
            p.enviar(self.conn, p.MSG_AUTH_FALLO, {"motivo": "Contraseña incorrecta"})
            return False
        with abrir_captura() as sct:
            m = sct.monitors[self.args.monitor if self.args.monitor < len(sct.monitors) else 1]
        p.enviar(self.conn, p.MSG_AUTH_OK, {"so": SO, "ancho": m["width"], "alto": m["height"],
                                            "solo_ver": self.args.solo_ver})
        return True

    def ejecutar(self):
        if not self.autenticar():
            return False
        hilo = threading.Thread(target=self.bucle_pantalla, daemon=True)
        hilo.start()
        try:
            while self.activo:
                tipo, datos = p.recibir(self.conn)
                if tipo == p.MSG_ENTRADA and not self.args.solo_ver:
                    try:
                        self.aplicar(p.a_json(datos))
                    except Exception as e:  # un evento raro no debe tirar la sesión
                        print("  Evento ignorado:", e)
                elif tipo == p.MSG_PORTAPAPELES and pyperclip:
                    msg = p.a_json(datos)
                    if msg.get("pedir"):
                        self.enviar(p.MSG_PORTAPAPELES, {"texto": pyperclip.paste() or ""})
                    elif "texto" in msg:
                        pyperclip.copy(msg["texto"])
                elif tipo == p.MSG_ADIOS:
                    break
        except (p.ErrorConexion, OSError):
            pass
        finally:
            self.activo = False
            self.soltar_todo()
        return True


def main():
    ap = argparse.ArgumentParser(description="Servidor de escritorio remoto (equipo a controlar)")
    ap.add_argument("--puerto", type=int, default=p.PUERTO_POR_DEFECTO)
    ap.add_argument("--contrasena", help="Contraseña de acceso (si no se indica se genera una)")
    ap.add_argument("--fps", type=int, default=15, help="Imágenes por segundo (defecto 15)")
    ap.add_argument("--calidad", type=int, default=60, help="Calidad JPEG 10-95 (defecto 60)")
    ap.add_argument("--ancho-max", type=int, default=1920,
                    help="Reduce la imagen a este ancho máximo (defecto 1920)")
    ap.add_argument("--monitor", type=int, default=1, help="Monitor a compartir (1 = principal)")
    ap.add_argument("--solo-ver", action="store_true",
                    help="El cliente solo puede ver, no controlar")
    args = ap.parse_args()
    if not args.contrasena:
        args.contrasena = "-".join(secrets.token_hex(2) for _ in range(3))

    ctx, huella = p.contexto_servidor()

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("0.0.0.0", args.puerto))
    srv.listen(1)

    print("=" * 64)
    print(f"  ESCRITORIO REMOTO - SERVIDOR  ({platform.system()} {platform.release()})")
    print("=" * 64)
    ip, otras = ips_locales()
    print(f"  IP para conectar : {ip}")
    print(f"  Puerto           : {args.puerto}")
    print(f"  Contraseña       : {args.contrasena}")
    print(f"  Huella TLS       : {huella[:47]}")
    print(f"                     {huella[48:]}")
    print(f"  Modo             : {'solo ver' if args.solo_ver else 'control total'}")
    if otras:
        print(f"  (Otras IPs, solo si la anterior no funciona: {', '.join(otras)})")
    print("-" * 64)
    if SO == "mac":
        print("  macOS: da permisos en Ajustes del Sistema > Privacidad y seguridad")
        print("  > 'Grabación de pantalla' y 'Accesibilidad' a tu Terminal/Python.")
        print("-" * 64)
    print("  Esperando conexiones... (Ctrl+C para salir)\n")

    try:
        while True:
            crudo, direccion = srv.accept()
            crudo.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            try:
                crudo.settimeout(15)
                conn = ctx.wrap_socket(crudo, server_side=True)
                conn.settimeout(None)
            except OSError:  # incluye ssl.SSLError
                crudo.close()
                continue
            print(f"[{time.strftime('%H:%M:%S')}] Conexión desde {direccion[0]}")
            try:
                ok = Sesion(conn, args).ejecutar()
                print(f"[{time.strftime('%H:%M:%S')}] "
                      + ("Sesión finalizada" if ok else "Autenticación fallida"))
            except Exception as e:
                print(f"[{time.strftime('%H:%M:%S')}] Error: {e}")
            finally:
                try:
                    conn.close()
                except OSError:
                    pass
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        srv.close()


if __name__ == "__main__":
    main()
