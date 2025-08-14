const Tax = require('../models/tax.model');

exports.getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.getAll();
    res.json(taxes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTax = async (req, res) => {
  try {
    const newTax = await Tax.create(req.body);
    res.status(201).json(newTax);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTax = async (req, res) => {
  try {
    const updatedTax = await Tax.update(req.params.id, req.body);
    if (!updatedTax) {
      return res.status(404).json({ message: 'Tipo de IVA no encontrado' });
    }
    res.json(updatedTax);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTax = async (req, res) => {
  try {
    await Tax.delete(req.params.id);
    res.json({ message: 'Tipo de IVA eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};