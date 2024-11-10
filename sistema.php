<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acceso al Sistema</title>
    <link rel="stylesheet" type="text/css" href="styles.css">
</head>
<body>
    <h2>Acceso al Sistema de Administración</h2>
    <form action="login.php" method="post">
        <label for="nombre">Nombre de Usuario:</label>
        <input type="text" id="nombre" name="nombre" required><br><br>

        <label for="correo">Contraseña:</label>
        <input type="password" id="correo" name="correo" required><br><br>

        <input type="submit" value="Iniciar Sesión">
    </form>
</body>
</html>