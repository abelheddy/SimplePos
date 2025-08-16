-- Tabla: Marcas
CREATE TABLE marcas (
    id_marca SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla: IVA (Impuestos)
CREATE TABLE ivas (
    id_iva SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,      -- Ej: IVA general, exento, etc.
    porcentaje DECIMAL(5, 2) NOT NULL        -- Ej: 16.00 para 16%
);

-- Tabla: Productos (telefonía)
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,            
    descripcion TEXT,
    modelo VARCHAR(100),                     
    precio_compra DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    codigo_barras VARCHAR(50) UNIQUE,
    id_marca INT,
    id_iva INT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca),
    FOREIGN KEY (id_iva) REFERENCES ivas(id_iva)
);

-- Tabla: Inventario
CREATE TABLE inventario (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INT,
    cantidad INT NOT NULL DEFAULT 0,
    ubicacion VARCHAR(100),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Tabla: Imágenes del producto
CREATE TABLE imagenes_producto (
    id_imagen SERIAL PRIMARY KEY,
    id_producto INT,
    url_imagen TEXT NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Tabla: Especificaciones técnicas
CREATE TABLE especificaciones (
    id_especificacion SERIAL PRIMARY KEY,
    id_producto INT,
    atributo VARCHAR(100) NOT NULL,         
    valor VARCHAR(255) NOT NULL,            
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
