-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-11-2024 a las 03:10:10
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tiendamariscos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `articulos`
--

CREATE TABLE `articulos` (
  `articulo_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `proveedor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `articulos`
--

INSERT INTO `articulos` (`articulo_id`, `nombre`, `descripcion`, `precio`, `stock`, `proveedor_id`) VALUES
(1, 'Camarón', 'Camarón fresco del Golfo', 15.00, 200, 1),
(2, 'Langosta', 'Langosta roja de mar', 30.00, 50, 2),
(3, 'Pulpo', 'Pulpo fresco', 25.00, 80, 3),
(4, 'Ostión', 'Ostión del Pacífico', 12.00, 150, 4),
(5, 'Calamar', 'Calamar mediano', 10.00, 100, 5),
(6, 'Filete de Pescado', 'Filete de tilapia', 8.00, 250, 6),
(7, 'Mejillón', 'Mejillón fresco', 14.00, 120, 7),
(8, 'Jaiba', 'Jaiba azul', 18.00, 60, 8),
(9, 'Almeja', 'Almeja blanca', 6.00, 200, 9),
(10, 'Cangrejo', 'Cangrejo de roca', 22.00, 40, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `cliente_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`cliente_id`, `nombre`, `direccion`, `telefono`, `correo`) VALUES
(1, 'Juan Pérez', 'Calle 123, Ciudad A', '555-1234', 'juan@example.com'),
(2, 'María Gómez', 'Av. Siempre Viva 742, Ciudad B', '555-5678', 'maria@example.com'),
(3, 'Carlos Ruiz', 'Calle 456, Ciudad A', '555-8765', 'carlos@example.com'),
(4, 'Ana López', 'Calle Falsa 123, Ciudad C', '555-4321', 'ana@example.com'),
(5, 'Luis Torres', 'Av. Principal 100, Ciudad D', '555-9988', 'luis@example.com'),
(6, 'Carmen Rodríguez', 'Plaza Mayor 5, Ciudad A', '555-6677', 'carmen@example.com'),
(7, 'Pedro Sánchez', 'Calle Luna 8, Ciudad E', '555-1122', 'pedro@example.com'),
(8, 'Sofía Vargas', 'Calle Sol 9, Ciudad F', '555-3344', 'sofia@example.com'),
(9, 'David Romero', 'Av. Libertad 200, Ciudad G', '555-7788', 'david@example.com'),
(10, 'Elena Díaz', 'Calle Norte 6, Ciudad H', '555-9900', 'elena@example.com');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_factura`
--

CREATE TABLE `detalle_factura` (
  `detalle_id` int(11) NOT NULL,
  `factura_id` int(11) DEFAULT NULL,
  `articulo_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `detalle_factura`
--

INSERT INTO `detalle_factura` (`detalle_id`, `factura_id`, `articulo_id`, `cantidad`, `precio_unitario`) VALUES
(1, 1, 1, 10, 15.00),
(2, 1, 2, 2, 30.00),
(3, 2, 3, 5, 25.00),
(4, 2, 4, 4, 12.00),
(5, 3, 5, 8, 10.00),
(6, 3, 6, 10, 8.00),
(7, 4, 7, 3, 14.00),
(8, 4, 8, 2, 18.00),
(9, 5, 9, 20, 6.00),
(10, 5, 10, 4, 22.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturacion`
--

CREATE TABLE `facturacion` (
  `factura_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `facturacion`
--

INSERT INTO `facturacion` (`factura_id`, `fecha`, `cliente_id`, `total`) VALUES
(1, '2024-01-05', 1, 150.00),
(2, '2024-01-06', 2, 200.00),
(3, '2024-01-07', 3, 250.00),
(4, '2024-01-08', 4, 300.00),
(5, '2024-01-09', 5, 120.00),
(6, '2024-01-10', 6, 180.00),
(7, '2024-01-11', 7, 220.00),
(8, '2024-01-12', 8, 160.00),
(9, '2024-01-13', 9, 210.00),
(10, '2024-01-14', 10, 190.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `proveedor_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`proveedor_id`, `nombre`, `direccion`, `telefono`, `correo`) VALUES
(1, 'Proveedor A', 'Calle Comercio 100, Ciudad A', '555-2233', 'proveedorA@example.com'),
(2, 'Proveedor B', 'Av. Marítima 50, Ciudad B', '555-4455', 'proveedorB@example.com'),
(3, 'Proveedor C', 'Calle Central 23, Ciudad C', '555-6677', 'proveedorC@example.com'),
(4, 'Proveedor D', 'Av. Las Olas 15, Ciudad D', '555-8899', 'proveedorD@example.com'),
(5, 'Proveedor E', 'Calle Marisco 12, Ciudad E', '555-1111', 'proveedorE@example.com'),
(6, 'Proveedor F', 'Calle Marina 8, Ciudad F', '555-3333', 'proveedorF@example.com'),
(7, 'Proveedor G', 'Av. Océano 21, Ciudad G', '555-5555', 'proveedorG@example.com'),
(8, 'Proveedor H', 'Plaza Pescador, Ciudad H', '555-7777', 'proveedorH@example.com'),
(9, 'Proveedor I', 'Calle Bahía 30, Ciudad I', '555-9999', 'proveedorI@example.com'),
(10, 'Proveedor J', 'Av. Atlántico 42, Ciudad J', '555-0000', 'proveedorJ@example.com');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `articulos`
--
ALTER TABLE `articulos`
  ADD PRIMARY KEY (`articulo_id`),
  ADD KEY `proveedor_id` (`proveedor_id`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`cliente_id`);

--
-- Indices de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD PRIMARY KEY (`detalle_id`),
  ADD KEY `factura_id` (`factura_id`),
  ADD KEY `articulo_id` (`articulo_id`);

--
-- Indices de la tabla `facturacion`
--
ALTER TABLE `facturacion`
  ADD PRIMARY KEY (`factura_id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`proveedor_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `articulos`
--
ALTER TABLE `articulos`
  MODIFY `articulo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `cliente_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  MODIFY `detalle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `facturacion`
--
ALTER TABLE `facturacion`
  MODIFY `factura_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `proveedor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `articulos`
--
ALTER TABLE `articulos`
  ADD CONSTRAINT `articulos_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`proveedor_id`);

--
-- Filtros para la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD CONSTRAINT `detalle_factura_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturacion` (`factura_id`),
  ADD CONSTRAINT `detalle_factura_ibfk_2` FOREIGN KEY (`articulo_id`) REFERENCES `articulos` (`articulo_id`);

--
-- Filtros para la tabla `facturacion`
--
ALTER TABLE `facturacion`
  ADD CONSTRAINT `facturacion_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`cliente_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
