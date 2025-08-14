const Brand = require('../models/brand.model');

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.getAll();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const newBrand = await Brand.create(req.body);
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const updatedBrand = await Brand.update(req.params.id, req.body);
    res.json(updatedBrand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    await Brand.delete(req.params.id);
    res.json({ message: 'Marca eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};