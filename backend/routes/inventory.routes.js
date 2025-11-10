// routes/inventories.routes.js
const express = require('express');
const router = express.Router();
const inventoriesController = require('../controllers/inventories.controller');
const { verifyAdmin } = require('../middleware/auth.middleware');
const inventoryUpload = require("../middleware/inventoryUpload");

// Create Inventory
router.post(
  '/',
  verifyAdmin,
  inventoryUpload.single('thumbnail_image'),
  inventoriesController.createInventory
);

// Update Inventory
router.put(
  '/:id',
  verifyAdmin,
  inventoryUpload.single('thumbnail_image'),
  inventoriesController.updateInventory
);

// Get all Inventories
router.get('/', verifyAdmin, inventoriesController.getAllInventories);

// Get inventory by ID
router.get('/:id', verifyAdmin, inventoriesController.getInventoryById);

// Delete Inventory
router.delete('/:id', verifyAdmin, inventoriesController.deleteInventory);

module.exports = router;
