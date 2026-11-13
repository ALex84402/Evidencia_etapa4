# Escritorio Remoto (Windows ⇄ Mac, Windows ⇄ Windows)

Aplicación sencilla para ver y controlar otro equipo por red. Funciona entre
cualquier combinación de **Windows** y **macOS** (y también Linux).

| Componente     | Se ejecuta en…                     | Qué hace                                  |
|----------------|------------------------------------|-------------------------------------------|
| `servidor.py`  | el equipo que **será controlado**  | comparte la pantalla y recibe ratón/teclado |
| `cliente.py`   | el equipo **desde el que controlas** | muestra la pantalla remota y envía tus acciones |

## Características

- Ver y controlar: ratón (clic izquierdo, derecho, central, arrastrar, rueda) y teclado.
- Conexión **cifrada con TLS** y verificación de identidad del servidor por huella (como SSH).
- Acceso con **contraseña** (desafío-respuesta: la contraseña nunca viaja por la red).
- **Traducción Ctrl ⇄ Cmd** automática entre Windows y Mac (Ctrl+C en Windows = Cmd+C en Mac).
- Compartir el **portapapeles** (texto) en ambos sentidos.
- Modo **solo ver**, selección de monitor, ajuste de calidad/FPS, pantalla completa.
- Solo envía imágenes cuando la pantalla cambia (ahorra ancho de banda).

## Instalación (en ambos equipos)

1. Instala **Python 3.9 o superior**: <https://www.python.org/downloads/>
   - En Windows marca la casilla **"Add Python to PATH"** al instalar.
2. Copia la carpeta `escritorio_remoto` a ambos equipos.
3. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
   (Los lanzadores `iniciar_*.bat` / `iniciar_*.command` ya lo hacen por ti.)

## Uso

### 1. En el equipo a controlar → servidor
- **Windows:** doble clic en `iniciar_servidor.bat`
- **Mac:** doble clic en `iniciar_servidor.command`
- O por terminal: `python servidor.py`

Verás algo así:
```
  Dirección(es) IP : 192.168.1.20
  Puerto           : 5900
  Contraseña       : 3f9a-71c2-b0d4
  Huella TLS       : 90:96:AB:D7:...
```

### 2. En tu equipo → cliente
- **Windows:** doble clic en `iniciar_cliente.bat`
- **Mac:** doble clic en `iniciar_cliente.command`
- O por terminal: `python cliente.py 192.168.1.20`

Escribe la IP, el puerto y la contraseña. La primera vez se te mostrará la
**huella** del servidor: compárala con la que aparece en la pantalla del
servidor y acepta si coincide.

### Opciones del servidor

```bash
python servidor.py --contrasena MiClave   # contraseña fija
python servidor.py --puerto 6000          # otro puerto
python servidor.py --fps 25 --calidad 75  # más fluido / más calidad (más ancho de banda)
python servidor.py --ancho-max 1280       # imagen más pequeña (redes lentas)
python servidor.py --monitor 2            # compartir el segundo monitor
python servidor.py --solo-ver             # el cliente solo puede mirar
```

## Permisos necesarios en macOS (servidor)

Si el **Mac es el equipo controlado**, ve a
**Ajustes del Sistema → Privacidad y seguridad** y activa para *Terminal*
(o la app con la que ejecutes Python):

- **Grabación de pantalla** – sin esto se verá solo el fondo de escritorio.
- **Accesibilidad** – sin esto no funcionará el ratón ni el teclado.

Después cierra y vuelve a abrir la Terminal.

## Firewall y redes

- **Windows**: la primera vez que arranques el servidor, el Firewall preguntará;
  pulsa **Permitir acceso** (red privada).
- **Misma red (casa/oficina)**: usa directamente la IP local que muestra el servidor.
- **Por Internet**: lo más fácil y seguro es instalar una VPN tipo
  [Tailscale](https://tailscale.com) o ZeroTier en ambos equipos y usar la IP
  que te asignen. Alternativamente puedes abrir/redirigir el puerto 5900 en el
  router del servidor (no recomendado sin una contraseña fuerte).

## Crear un ejecutable (sin necesidad de instalar Python)

```bash
pip install pyinstaller
# Windows
pyinstaller --onefile --name ServidorRemoto servidor.py
pyinstaller --onefile --windowed --name ClienteRemoto cliente.py
# macOS
pyinstaller --onefile --name ServidorRemoto servidor.py
pyinstaller --windowed --name ClienteRemoto cliente.py
```
Los ejecutables quedan en `dist/`. Hay que compilar en cada sistema operativo
(el `.exe` se crea en Windows y la `.app` en Mac).

## Limitaciones conocidas

- **Ctrl+Alt+Supr** no se puede enviar a Windows (Windows lo bloquea por seguridad).
- Las pantallas de **UAC** de Windows y la **pantalla de bloqueo** no se pueden
  controlar si el servidor no se ejecuta como administrador / servicio.
- Sin audio ni transferencia de archivos (solo portapapeles de texto).
- Un cliente a la vez.

## Archivos

```
protocolo.py               Protocolo de red, TLS y autenticación (compartido)
servidor.py                Equipo a controlar
cliente.py                 Visor / control (interfaz Tkinter)
requirements.txt           Dependencias
iniciar_servidor.bat/.command
iniciar_cliente.bat/.command
```
