<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header("Location: sistema.php");
    exit();
}

$host = 'localhost';
$dbname = 'TiendaMariscos';
$username = 'root';
$password = '';

try {
    $conexion = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conexion->query("SELECT * FROM clientes");
    echo "<h2>Clientes</h2><table border='1'><tr><th>ID</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Correo</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td>{$row['cliente_id']}</td><td>{$row['nombre']}</td><td>{$row['direccion']}</td><td>{$row['telefono']}</td><td>{$row['correo']}</td></tr>";
    }
    echo "</table>";

    $stmt = $conexion->query("SELECT * FROM proveedores");
    echo "<h2>Proveedores</h2><table border='1'><tr><th>ID</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Correo</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td>{$row['proveedor_id']}</td><td>{$row['nombre']}</td><td>{$row['direccion']}</td><td>{$row['telefono']}</td><td>{$row['correo']}</td></tr>";
    }
    echo "</table>";
    
    echo '<p><a href="logout.php">Cerrar sesión</a></p>';

} catch (PDOException $e) {
    echo "Error en la conexión: " . $e->getMessage();
}
?>