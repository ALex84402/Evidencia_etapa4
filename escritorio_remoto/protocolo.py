"""
Protocolo compartido entre servidor y cliente.

Cada mensaje viaja así:  [1 byte tipo][4 bytes longitud big-endian][datos]
Toda la conexión va cifrada con TLS (certificado autofirmado generado por el
servidor y verificado por el cliente mediante su huella SHA-256).
"""

import datetime
import hashlib
import hmac
import json
import os
import socket
import ssl
import struct
from pathlib import Path

VERSION = 1
PUERTO_POR_DEFECTO = 5900

# Tipos de mensaje
MSG_HOLA = 1        # servidor -> cliente: {version, so, nonce}
MSG_AUTH = 2        # cliente  -> servidor: {hmac}
MSG_AUTH_OK = 3     # servidor -> cliente: {so, ancho, alto}
MSG_AUTH_FALLO = 4  # servidor -> cliente: {motivo}
MSG_IMAGEN = 5      # servidor -> cliente: bytes JPEG
MSG_ENTRADA = 6     # cliente  -> servidor: evento de ratón/teclado (JSON)
MSG_PORTAPAPELES = 7  # ambos sentidos: {texto}
MSG_ADIOS = 8

_CABECERA = struct.Struct(">BI")
TAMANO_MAXIMO = 64 * 1024 * 1024

CARPETA_CONFIG = Path.home() / ".escritorio_remoto"


class ErrorConexion(Exception):
    pass


def _recibir_exacto(sock, n):
    datos = bytearray()
    while len(datos) < n:
        trozo = sock.recv(n - len(datos))
        if not trozo:
            raise ErrorConexion("La conexión se cerró")
        datos.extend(trozo)
    return bytes(datos)


def enviar(sock, tipo, datos=b""):
    if isinstance(datos, (dict, list)):
        datos = json.dumps(datos).encode("utf-8")
    sock.sendall(_CABECERA.pack(tipo, len(datos)) + datos)


def recibir(sock):
    tipo, longitud = _CABECERA.unpack(_recibir_exacto(sock, _CABECERA.size))
    if longitud > TAMANO_MAXIMO:
        raise ErrorConexion("Mensaje demasiado grande")
    return tipo, _recibir_exacto(sock, longitud)


def a_json(datos):
    return json.loads(datos.decode("utf-8"))


# --------------------------------------------------------------------------
# Autenticación por desafío-respuesta (la contraseña nunca viaja por la red)
# --------------------------------------------------------------------------

def nuevo_nonce():
    return os.urandom(32).hex()


def calcular_respuesta(contrasena, nonce):
    return hmac.new(contrasena.encode("utf-8"), bytes.fromhex(nonce),
                    hashlib.sha256).hexdigest()


def respuesta_valida(contrasena, nonce, respuesta):
    return hmac.compare_digest(calcular_respuesta(contrasena, nonce), respuesta)


# --------------------------------------------------------------------------
# TLS
# --------------------------------------------------------------------------

def huella(der_bytes):
    h = hashlib.sha256(der_bytes).hexdigest().upper()
    return ":".join(h[i:i + 2] for i in range(0, len(h), 2))


def asegurar_certificado():
    """Crea (una sola vez) un certificado autofirmado para el servidor."""
    CARPETA_CONFIG.mkdir(parents=True, exist_ok=True)
    cert = CARPETA_CONFIG / "servidor_cert.pem"
    clave = CARPETA_CONFIG / "servidor_clave.pem"
    if cert.exists() and clave.exists():
        return str(cert), str(clave)

    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.x509.oid import NameOID

    k = ec.generate_private_key(ec.SECP256R1())
    nombre = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,
                                           f"EscritorioRemoto-{socket.gethostname()}")])
    ahora = datetime.datetime.now(datetime.timezone.utc)
    certificado = (
        x509.CertificateBuilder()
        .subject_name(nombre).issuer_name(nombre)
        .public_key(k.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(ahora - datetime.timedelta(days=1))
        .not_valid_after(ahora + datetime.timedelta(days=3650))
        .sign(k, hashes.SHA256())
    )
    clave.write_bytes(k.private_bytes(serialization.Encoding.PEM,
                                      serialization.PrivateFormat.PKCS8,
                                      serialization.NoEncryption()))
    try:
        os.chmod(clave, 0o600)
    except OSError:
        pass
    cert.write_bytes(certificado.public_bytes(serialization.Encoding.PEM))
    return str(cert), str(clave)


def contexto_servidor():
    cert, clave = asegurar_certificado()
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx.load_cert_chain(cert, clave)
    der = ssl.PEM_cert_to_DER_cert(Path(cert).read_text())
    return ctx, huella(der)


def contexto_cliente():
    # La identidad se verifica manualmente con la huella (modelo "confiar la
    # primera vez", igual que SSH), por eso no se valida contra una CA.
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


_ARCHIVO_CONOCIDOS = CARPETA_CONFIG / "equipos_conocidos.json"


def huella_conocida(equipo):
    try:
        return json.loads(_ARCHIVO_CONOCIDOS.read_text()).get(equipo)
    except (OSError, ValueError):
        return None


def guardar_huella(equipo, valor):
    CARPETA_CONFIG.mkdir(parents=True, exist_ok=True)
    try:
        datos = json.loads(_ARCHIVO_CONOCIDOS.read_text())
    except (OSError, ValueError):
        datos = {}
    datos[equipo] = valor
    _ARCHIVO_CONOCIDOS.write_text(json.dumps(datos, indent=2))
