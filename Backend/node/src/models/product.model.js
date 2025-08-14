const pool = require('../db');

const Product = {
  async getAll() {
    try {
      const query = `
      SELECT 
        p.*, 
        m.nombre as marca_nombre, 
        i.porcentaje as iva_porcentaje,
        COALESCE((
          SELECT SUM(cantidad) 
          FROM inventario 
          WHERE id_producto = p.id_producto
        ), 0) as stock
      FROM productos p
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
      LEFT JOIN ivas i ON p.id_iva = i.id_iva
      WHERE p.activo = true
    `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getById(id) {
    try {
      const query = `
        SELECT p.*, m.nombre as marca_nombre, i.porcentaje as iva_porcentaje
        FROM productos p
        LEFT JOIN marcas m ON p.id_marca = m.id_marca
        LEFT JOIN ivas i ON p.id_iva = i.id_iva
        WHERE p.id_producto = $1 AND p.activo = true
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async create(productData) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO productos(
        nombre, descripcion, modelo, precio_compra, 
        precio_venta, sku, codigo_barras, id_marca, id_iva
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
        [
          productData.nombre,
          productData.descripcion,
          productData.modelo,
          productData.precio_compra,
          productData.precio_venta,
          productData.sku,
          productData.codigo_barras,
          productData.id_marca,
          productData.id_iva
        ]
      );
      return rows[0];
    } catch (error) {
      if (error.code === '23505') { // Código de error de violación de unicidad
        throw new Error(`El SKU o código de barras ya existe: ${error.detail}`);
      }
      throw error;
    }
  },

  async update(id, updateFields) {
    try {
      // Conservar valores existentes para campos no proporcionados
      const existingProduct = await this.getById(id);
      if (!existingProduct) throw new Error('Producto no encontrado');

      const mergedProduct = {
        ...existingProduct,
        ...updateFields,
        id_producto: id // Asegurar que el ID no se modifique
      };

      const { rows } = await pool.query(
        `UPDATE productos SET
        nombre = $1,
        descripcion = $2,
        modelo = $3,
        precio_compra = $4,
        precio_venta = $5,
        sku = $6,
        codigo_barras = $7,
        id_marca = $8,
        id_iva = $9
      WHERE id_producto = $10
      RETURNING *`,
        [
          mergedProduct.nombre,
          mergedProduct.descripcion,
          mergedProduct.modelo,
          mergedProduct.precio_compra,
          mergedProduct.precio_venta,
          mergedProduct.sku,
          mergedProduct.codigo_barras,
          mergedProduct.id_marca,
          mergedProduct.id_iva,
          id
        ]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
  async delete(id) {
    try {
      // En lugar de borrar, marcamos como inactivo (soft delete)
      const { rows } = await pool.query(
        'UPDATE productos SET activo = false WHERE id_producto = $1 RETURNING *',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Product;