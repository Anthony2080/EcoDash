CREATE DATABASE IF NOT EXISTS ecodash_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ecodash_db;

# Usuario
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    telefono INT NOT NULL,
    direccion TEXT NOT NULL,
    password VARCHAR(128) NOT NULL,
    rol ENUM('cliente', 'repartidor') NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

# Cliente
CREATE TABLE usuario_cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

# Repartidor
CREATE TABLE usuario_repartidor (
    id_repartidor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
    calificacion DECIMAL(7,2) NOT NULL DEFAULT 00000.00,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

# Envio
CREATE TABLE envio (
    id_envio INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_repartidor INT NULL,
    origenGeo TEXT NOT NULL,
    destinoGeo TEXT NOT NULL,
    distanciaKm DECIMAL(4,1) NOT NULL,
    pesoKg DECIMAL(2,1) NOT NULL,
    estado ENUM('pendiente', 'asignado', 'retirado', 'en_camino', 'entregado', 'cancelado') 
        NOT NULL DEFAULT 'pendiente',
    precio DECIMAL(10,2) NOT NULL,
    fotoEntrega TEXT NULL,
    firmaDigital TEXT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME NULL,
    FOREIGN KEY (id_cliente) REFERENCES usuario_cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_repartidor) REFERENCES usuario_repartidor(id_repartidor) ON DELETE SET NULL
);

# Pago
CREATE TABLE pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_envio INT NOT NULL UNIQUE,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('mercadopago', 'transferencia') NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado', 'reembolsado'),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_id VARCHAR(20) NULL,
    FOREIGN KEY (id_envio) REFERENCES envio(id_envio) ON DELETE CASCADE
);

# Notificaciones
CREATE TABLE notificacion (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

# drop database ecodash_db