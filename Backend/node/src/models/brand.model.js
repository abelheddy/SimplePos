const pool = require('../db');

const Brand = {
  async getAll() {
    try {
      const query = `
        SELECT m.*, COUNT(p.id_producto) as product_count 
        FROM marcas m 
        LEFT JOIN productos p ON m.id_marca = p.id_marca 
        GROUP BY m.id_marca
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async create(brandData) {
    try {
      const { rows } = await pool.query(
        'INSERT INTO marcas(nombre, descripcion) VALUES($1, $2) RETURNING *',
        [brandData.nombre, brandData.descripcion || '']
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async update(id, updateFields) {
    try {
      const { rows } = await pool.query(
        'UPDATE marcas SET nombre = $1, descripcion = $2 WHERE id_marca = $3 RETURNING *',
        [updateFields.nombre, updateFields.descripcion || '', id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      // Verificar si hay productos asociados
      const checkProducts = await pool.query(
        'SELECT COUNT(*) FROM productos WHERE id_marca = $1',
        [id]
      );
      
      if (parseInt(checkProducts.rows[0].count) > 0) {
        throw new Error('No se puede eliminar la marca porque tiene productos asociados');
      }

      const { rows } = await pool.query(
        'DELETE FROM marcas WHERE id_marca = $1 RETURNING *',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Brand;