const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

router.post('/', inventoryController.createInventory);

router.put('/product/:id', inventoryController.updateInventoryByProduct);
router.post('/update', inventoryController.createOrUpdateInventory);

module.exports = router;