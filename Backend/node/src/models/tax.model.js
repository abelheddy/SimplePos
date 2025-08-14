const pool = require('../db');

const Tax = {
  async getAll() {
    try {
      const { rows } = await pool.query('SELECT * FROM ivas ORDER BY id_iva');
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async create(taxData) {
    try {
      const { rows } = await pool.query(
        'INSERT INTO ivas(descripcion, porcentaje) VALUES($1, $2) RETURNING *',
        [taxData.descripcion, taxData.porcentaje]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async update(id, updateFields) {
    try {
      const { rows } = await pool.query(
        'UPDATE ivas SET descripcion = $1, porcentaje = $2 WHERE id_iva = $3 RETURNING *',
        [updateFields.descripcion, updateFields.porcentaje, id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      // Verificar si hay productos usando este IVA
      const { rows } = await pool.query(
        'SELECT COUNT(*) FROM productos WHERE id_iva = $1',
        [id]
      );
      
      if (parseInt(rows[0].count) > 0) {
        throw new Error('No se puede eliminar, hay productos asociados a este IVA');
      }

      const { rows: deletedRows } = await pool.query(
        'DELETE FROM ivas WHERE id_iva = $1 RETURNING *',
        [id]
      );
      return deletedRows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Tax;