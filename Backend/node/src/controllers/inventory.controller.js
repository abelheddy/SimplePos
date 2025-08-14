const Inventory = require('../models/inventory.model');

exports.createInventory = async (req, res) => {
  try {
    const newInventory = await Inventory.create(req.body);
    res.status(201).json(newInventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryByProduct = async (req, res) => {
  try {
    const updatedInventory = await Inventory.updateByProductId(
      req.params.id, 
      req.body
    );
    res.json(updatedInventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createOrUpdateInventory = async (req, res) => {
  try {
    const { id_producto, cantidad } = req.body;
    
    // Verificar si ya existe un registro para este producto
    const existing = await pool.query(
      'SELECT id_inventario FROM inventario WHERE id_producto = $1',
      [id_producto]
    );
    
    let result;
    if (existing.rows.length > 0) {
      // Actualizar existente
      result = await pool.query(
        'UPDATE inventario SET cantidad = $1 WHERE id_producto = $2 RETURNING *',
        [cantidad, id_producto]
      );
    } else {
      // Crear nuevo
      result = await pool.query(
        'INSERT INTO inventario (id_producto, cantidad, ubicacion) VALUES ($1, $2, $3) RETURNING *',
        [id_producto, cantidad, 'Almacén principal']
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};