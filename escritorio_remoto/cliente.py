"""
CLIENTE (equipo desde el que controlas).

    python cliente.py                       # abre la ventana de conexión
    python cliente.py 192.168.1.20          # conecta directamente (pide la contraseña)

Muestra la pantalla remota y envía tu ratón y teclado.
"""

import argparse
import io
import queue
import socket
import sys
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk

from PIL import Image, ImageTk

import protocolo as p

SO_LOCAL = {"win32": "windows", "darwin": "mac"}.get(sys.platform, "linux")
NOMBRES_SO = {"windows": "Windows", "mac": "macOS", "linux": "Linux"}

TECLAS_CMD = {"Meta_L", "Meta_R", "Command", "Super_L", "Super_R", "Win_L", "Win_R"}
TECLAS_CTRL = {"Control_L", "Control_R"}


# ==========================================================================
# Conexión
# ==========================================================================

class Conexion:
    def __init__(self, host, puerto, contrasena, ventana_padre):
        crudo = socket.create_connection((host, puerto), timeout=10)
        crudo.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        self.sock = p.contexto_cliente().wrap_socket(crudo, server_hostname=host)

        # Verificación de identidad del servidor (huella del certificado)
        h = p.huella(self.sock.getpeercert(binary_form=True))
        clave = f"{host}:{puerto}"
        conocida = p.huella_conocida(clave)
        if conocida is None:
            if not messagebox.askyesno(
                    "Equipo nuevo",
                    f"Es la primera vez que te conectas a {clave}.\n\n"
                    f"Huella del servidor:\n{h}\n\n"
                    "Compárala con la que muestra el servidor en su pantalla.\n"
                    "¿Coinciden y quieres continuar?", parent=ventana_padre):
                self.sock.close()
                raise p.ErrorConexion("Conexión cancelada por el usuario")
            p.guardar_huella(clave, h)
        elif conocida != h:
            if not messagebox.askyesno(
                    "¡ATENCIÓN! La huella ha cambiado",
                    f"La identidad de {clave} es distinta a la guardada.\n"
                    "Puede ser que se reinstaló el servidor... o un ataque.\n\n"
                    f"Antes : {conocida}\nAhora : {h}\n\n¿Confiar en la nueva huella?",
                    icon="warning", parent=ventana_padre):
                self.sock.close()
                raise p.ErrorConexion("Huella del servidor no coincide")
            p.guardar_huella(clave, h)

        tipo, datos = p.recibir(self.sock)
        if tipo != p.MSG_HOLA:
            raise p.ErrorConexion("Respuesta inesperada del servidor")
        hola = p.a_json(datos)
        if hola.get("version") != p.VERSION:
            raise p.ErrorConexion("Versión del servidor incompatible")
        p.enviar(self.sock, p.MSG_AUTH, {"hmac": p.calcular_respuesta(contrasena, hola["nonce"])})
        tipo, datos = p.recibir(self.sock)
        info = p.a_json(datos)
        if tipo != p.MSG_AUTH_OK:
            self.sock.close()
            raise p.ErrorConexion(info.get("motivo", "Acceso denegado"))
        self.sock.settimeout(None)
        self.info = {**hola, **info}
        self.lock = threading.Lock()

    def enviar(self, tipo, datos):
        with self.lock:
            p.enviar(self.sock, tipo, datos)

    def cerrar(self):
        try:
            self.enviar(p.MSG_ADIOS, b"")
        except OSError:
            pass
        try:
            self.sock.close()
        except OSError:
            pass


# ==========================================================================
# Ventana de conexión
# ==========================================================================

class DialogoConexion(tk.Tk):
    def __init__(self, host=""):
        super().__init__()
        self.title("Escritorio remoto - Conectar")
        self.resizable(False, False)
        self.conexion = None

        marco = ttk.Frame(self, padding=20)
        marco.pack(fill="both", expand=True)
        ttk.Label(marco, text="Conectar a otro equipo",
                  font=("TkDefaultFont", 13, "bold")).grid(row=0, column=0, columnspan=2,
                                                            pady=(0, 12), sticky="w")
        self.v_host = tk.StringVar(value=host)
        self.v_puerto = tk.StringVar(value=str(p.PUERTO_POR_DEFECTO))
        self.v_clave = tk.StringVar()
        for fila, (texto, var, extra) in enumerate([
                ("IP o nombre del equipo:", self.v_host, {}),
                ("Puerto:", self.v_puerto, {}),
                ("Contraseña:", self.v_clave, {"show": "•"})], start=1):
            ttk.Label(marco, text=texto).grid(row=fila, column=0, sticky="w", pady=4)
            e = ttk.Entry(marco, textvariable=var, width=28, **extra)
            e.grid(row=fila, column=1, pady=4)
            if fila == 1:
                e.focus_set()
            e.bind("<Return>", lambda _e: self.conectar())
        self.boton = ttk.Button(marco, text="Conectar", command=self.conectar)
        self.boton.grid(row=4, column=0, columnspan=2, pady=(12, 0), sticky="ew")
        self.estado = ttk.Label(marco, text="", foreground="#b00020")
        self.estado.grid(row=5, column=0, columnspan=2, pady=(8, 0))

    def conectar(self):
        host = self.v_host.get().strip()
        if not host:
            self.estado.config(text="Escribe la IP del equipo remoto")
            return
        try:
            puerto = int(self.v_puerto.get())
        except ValueError:
            self.estado.config(text="Puerto no válido")
            return
        self.estado.config(text="Conectando...", foreground="#555")
        self.update_idletasks()
        try:
            self.conexion = Conexion(host, puerto, self.v_clave.get(), self)
        except (OSError, p.ErrorConexion) as e:
            self.estado.config(text=f"No se pudo conectar: {e}", foreground="#b00020")
            return
        self.destroy()


# ==========================================================================
# Visor remoto
# ==========================================================================

class Visor(tk.Tk):
    def __init__(self, conexion):
        super().__init__()
        self.cx = conexion
        info = conexion.info
        self.so_remoto = info.get("so", "?")
        self.solo_ver = info.get("solo_ver", False)
        self.title(f"Escritorio remoto - {info.get('equipo', '')} "
                   f"({NOMBRES_SO.get(self.so_remoto, self.so_remoto)})")
        ancho, alto = info.get("ancho", 1280), info.get("alto", 720)
        pw, ph = self.winfo_screenwidth() * 0.85, self.winfo_screenheight() * 0.85
        esc = min(1.0, pw / ancho, ph / alto)
        self.geometry(f"{int(ancho * esc)}x{int(alto * esc) + 34}")
        self.configure(bg="#111")

        self.boton_tk = self._mapa_botones()
        self.v_traducir = tk.BooleanVar(value=SO_LOCAL != self.so_remoto
                                        and "mac" in (SO_LOCAL, self.so_remoto))

        # ---- barra de herramientas
        barra = ttk.Frame(self, padding=(6, 3))
        barra.pack(side="top", fill="x")
        ttk.Button(barra, text="Enviar portapapeles →", command=self.enviar_portapapeles).pack(side="left")
        ttk.Button(barra, text="← Traer portapapeles", command=self.pedir_portapapeles).pack(side="left", padx=4)
        ttk.Checkbutton(barra, text="Traducir Ctrl ⇄ Cmd", variable=self.v_traducir).pack(side="left", padx=8)
        ttk.Button(barra, text="Pantalla completa", command=self.pantalla_completa).pack(side="left")
        ttk.Button(barra, text="Desconectar", command=self.cerrar).pack(side="right")
        self.lbl_estado = ttk.Label(barra, text="")
        self.lbl_estado.pack(side="right", padx=10)

        # ---- lienzo
        self.lienzo = tk.Canvas(self, bg="#111", highlightthickness=0, cursor="arrow")
        self.lienzo.pack(fill="both", expand=True)
        self.id_img = self.lienzo.create_image(0, 0, anchor="nw")
        self.foto = None
        self.geom = (0, 0, 1, 1)  # x, y, ancho, alto de la imagen dibujada

        self.cola = queue.Queue(maxsize=1)
        self.ultima = None
        self.cuadros = 0
        self.t_fps = time.monotonic()
        self.ultimo_mov = 0.0
        self.mov_pendiente = None
        self.activo = True

        if not self.solo_ver:
            self._enlazar_eventos()

        self.protocol("WM_DELETE_WINDOW", self.cerrar)
        self.bind("<Configure>", lambda _e: self._redibujar())
        threading.Thread(target=self._recibir, daemon=True).start()
        self.after(15, self._refrescar)
        self.lienzo.focus_set()

    # ------------------------------------------------------------- utilidades
    def _mapa_botones(self):
        if SO_LOCAL == "mac":
            nivel = self.tk.call("info", "patchlevel")
            mayor, menor = (int(x) for x in nivel.split(".")[:2])
            if (mayor, menor) < (8, 7):  # en Tk antiguo de macOS el 2 es el derecho
                return {1: "izq", 2: "der", 3: "med"}
        return {1: "izq", 2: "med", 3: "der"}

    def _enviar_ev(self, ev):
        try:
            self.cx.enviar(p.MSG_ENTRADA, ev)
        except OSError:
            self._desconectado()

    def _normalizar(self, x, y):
        gx, gy, gw, gh = self.geom
        return (x - gx) / max(gw, 1), (y - gy) / max(gh, 1)

    # ------------------------------------------------------------- red
    def _recibir(self):
        try:
            while self.activo:
                tipo, datos = p.recibir(self.cx.sock)
                if tipo == p.MSG_IMAGEN:
                    img = Image.open(io.BytesIO(datos))
                    img.load()
                    try:
                        self.cola.get_nowait()
                    except queue.Empty:
                        pass
                    self.cola.put(img)
                elif tipo == p.MSG_PORTAPAPELES:
                    texto = p.a_json(datos).get("texto", "")
                    self.after(0, self._recibido_portapapeles, texto)
        except (p.ErrorConexion, OSError):
            if self.activo:
                self.after(0, self._desconectado)

    def _desconectado(self):
        if not self.activo:
            return
        self.activo = False
        messagebox.showinfo("Escritorio remoto", "Se perdió la conexión con el equipo remoto.")
        self.destroy()

    # ------------------------------------------------------------- dibujo
    def _refrescar(self):
        if not self.activo:
            return
        try:
            self.ultima = self.cola.get_nowait()
            self.cuadros += 1
            self._redibujar()
        except queue.Empty:
            pass
        ahora = time.monotonic()
        if ahora - self.t_fps >= 1:
            self.lbl_estado.config(text=f"{self.cuadros / (ahora - self.t_fps):.0f} fps"
                                   + ("  ·  solo ver" if self.solo_ver else ""))
            self.cuadros, self.t_fps = 0, ahora
        self.after(15, self._refrescar)

    def _redibujar(self):
        if self.ultima is None:
            return
        cw, ch = self.lienzo.winfo_width(), self.lienzo.winfo_height()
        if cw < 2 or ch < 2:
            return
        iw, ih = self.ultima.size
        esc = min(cw / iw, ch / ih)
        w, h = max(1, int(iw * esc)), max(1, int(ih * esc))
        img = self.ultima if (w, h) == (iw, ih) else self.ultima.resize((w, h), Image.BILINEAR)
        self.foto = ImageTk.PhotoImage(img)
        x, y = (cw - w) // 2, (ch - h) // 2
        self.geom = (x, y, w, h)
        self.lienzo.coords(self.id_img, x, y)
        self.lienzo.itemconfigure(self.id_img, image=self.foto)

    # ------------------------------------------------------------- entrada
    def _enlazar_eventos(self):
        c = self.lienzo
        c.bind("<Motion>", self._mover)
        for n in (1, 2, 3):
            c.bind(f"<B{n}-Motion>", self._mover)
            c.bind(f"<ButtonPress-{n}>", lambda e, n=n: self._boton(e, n, "bajar"))
            c.bind(f"<ButtonRelease-{n}>", lambda e, n=n: self._boton(e, n, "subir"))
        c.bind("<MouseWheel>", self._rueda)
        c.bind("<Shift-MouseWheel>", lambda e: self._rueda(e, horizontal=True))
        c.bind("<Button-4>", lambda e: self._enviar_ev({"t": "rueda", "dx": 0, "dy": 1}))
        c.bind("<Button-5>", lambda e: self._enviar_ev({"t": "rueda", "dx": 0, "dy": -1}))
        c.bind("<KeyPress>", lambda e: self._tecla(e, "tecla_bajar"))
        c.bind("<KeyRelease>", lambda e: self._tecla(e, "tecla_subir"))
        c.bind("<FocusOut>", lambda e: self._enviar_ev({"t": "soltar_todo"}))
        c.bind("<Enter>", lambda e: c.focus_set())

    def _mover(self, e):
        # Limita a ~60 eventos/s para no saturar la red
        self.mov_pendiente = self._normalizar(e.x, e.y)
        ahora = time.monotonic()
        if ahora - self.ultimo_mov >= 0.016:
            self.ultimo_mov = ahora
            x, y = self.mov_pendiente
            self._enviar_ev({"t": "mover", "x": x, "y": y})

    def _boton(self, e, n, accion):
        self.lienzo.focus_set()
        x, y = self._normalizar(e.x, e.y)
        self._enviar_ev({"t": accion, "b": self.boton_tk.get(n, "izq"), "x": x, "y": y})

    def _rueda(self, e, horizontal=False):
        d = e.delta
        pasos = d // 120 if abs(d) >= 120 else (1 if d > 0 else -1 if d < 0 else 0)
        if pasos:
            ev = {"t": "rueda", "dx": -pasos if horizontal else 0, "dy": 0 if horizontal else pasos}
            self._enviar_ev(ev)

    def _tecla(self, e, accion):
        nombre = e.keysym
        if self.v_traducir.get():
            if SO_LOCAL == "mac" and nombre in TECLAS_CMD:
                nombre = "Control_L"          # Cmd (Mac) -> Ctrl (Windows)
            elif self.so_remoto == "mac" and nombre in TECLAS_CTRL:
                nombre = "Meta_L"             # Ctrl (Windows) -> Cmd (Mac)
        self._enviar_ev({"t": accion, "k": nombre, "c": e.char})
        return "break"  # evita que Tab, etc. muevan el foco local

    # ------------------------------------------------------------- acciones
    def enviar_portapapeles(self):
        try:
            texto = self.clipboard_get()
        except tk.TclError:
            texto = ""
        self._enviar_ev_tipo(p.MSG_PORTAPAPELES, {"texto": texto})
        self.lbl_estado.config(text="Portapapeles enviado")

    def pedir_portapapeles(self):
        self._enviar_ev_tipo(p.MSG_PORTAPAPELES, {"pedir": True})

    def _recibido_portapapeles(self, texto):
        self.clipboard_clear()
        self.clipboard_append(texto)
        self.lbl_estado.config(text="Portapapeles recibido")

    def _enviar_ev_tipo(self, tipo, datos):
        try:
            self.cx.enviar(tipo, datos)
        except OSError:
            self._desconectado()

    def pantalla_completa(self):
        # La barra sigue visible: vuelve a pulsar el botón para salir
        self.attributes("-fullscreen", not self.attributes("-fullscreen"))

    def cerrar(self):
        self.activo = False
        self.cx.cerrar()
        self.destroy()


def main():
    ap = argparse.ArgumentParser(description="Cliente de escritorio remoto")
    ap.add_argument("host", nargs="?", default="", help="IP del equipo remoto")
    args = ap.parse_args()

    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass

    dialogo = DialogoConexion(args.host)
    dialogo.mainloop()
    if dialogo.conexion is None:
        return
    Visor(dialogo.conexion).mainloop()


if __name__ == "__main__":
    main()
