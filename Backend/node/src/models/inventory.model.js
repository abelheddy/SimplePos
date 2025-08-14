const pool = require('../db');

const Inventory = {
  async create(inventoryData) {
    try {
      const { rows } = await pool.query(
        'INSERT INTO inventario(id_producto, cantidad, ubicacion) VALUES($1, $2, $3) RETURNING *',
        [inventoryData.id_producto, inventoryData.cantidad, inventoryData.ubicacion]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

    async updateByProductId(productId, updateData) {
    try {
      // Verificar si existe un registro de inventario para este producto
      const checkQuery = 'SELECT id_inventario FROM inventario WHERE id_producto = $1';
      const checkResult = await pool.query(checkQuery, [productId]);
      
      let result;
      if (checkResult.rows.length > 0) {
        // Actualizar si existe
        const updateQuery = `
          UPDATE inventario 
          SET cantidad = $1 
          WHERE id_producto = $2 
          RETURNING *
        `;
        result = await pool.query(updateQuery, [updateData.cantidad, productId]);
      } else {
        // Crear si no existe
        const insertQuery = `
          INSERT INTO inventario (id_producto, cantidad, ubicacion) 
          VALUES ($1, $2, $3) 
          RETURNING *
        `;
        result = await pool.query(insertQuery, [
          productId, 
          updateData.cantidad, 
          updateData.ubicacion || 'Almacén principal'
        ]);
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Inventory;