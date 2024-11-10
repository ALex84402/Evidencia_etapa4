<?php
$host = 'localhost';
$dbname = 'TiendaMariscos';
$username = 'root';
$password = '';

try {
    $conexion = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conexion->query("SELECT nombre, descripcion, precio FROM articulos");
    echo "<h1>Productos de Mariscos</h1>";
    echo "<ul>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<li><strong>{$row['nombre']}</strong>: {$row['descripcion']} - \${$row['precio']}</li>";
    }
    echo "</ul>";
} catch (PDOException $e) {
    echo "Error en la conexión: " . $e->getMessage();
}
?>