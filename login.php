<?php
session_start();

$host = 'localhost';
$dbname = 'TiendaMariscos';
$username = 'root';
$password = '';

$nombre = $_POST['nombre'];
$correo = $_POST['correo'];

try {
    $conexion = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conexion->prepare("SELECT * FROM clientes WHERE nombre = :nombre AND correo = :correo");
    $stmt->bindParam(':nombre', $nombre);
    $stmt->bindParam(':correo', $correo);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $_SESSION['usuario'] = $nombre;
        header("Location: admin.php");
    } else {
        echo "<p>Error: Nombre de usuario o contraseña incorrectos.</p>";
        echo '<p><a href="sistema.php">Intentar de nuevo</a></p>';
    }
} catch (PDOException $e) {
    echo "Error en la conexión: " . $e->getMessage();
}
?>