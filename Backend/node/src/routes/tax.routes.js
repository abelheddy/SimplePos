const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');

router.get('/', taxController.getAllTaxes);
router.post('/', taxController.createTax);
router.put('/:id', taxController.updateTax);
router.delete('/:id', taxController.deleteTax);

module.exports = router;