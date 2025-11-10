const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const Inventory = require('../models/inventory.model');

// Create Inventory
exports.createInventory = async (req, res) => {
  const {
    product_id,
    opening_stock,
    stock_in,
    stock_out,
    missing,
    damaged,
  } = req.body;

  try {
    // Product ID required hai
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Create Inventory entry
    await Inventory.createInventory({
      product_id,
      opening_stock: opening_stock || 0,
      stock_in: stock_in || 0,
      stock_out: stock_out || 0,
      missing: missing || 0,
      damaged: damaged || 0,
    });

    res.status(201).json({ message: 'Inventory created successfully' });
  } catch (err) {
    console.error('Create Inventory error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get Inventory by ID
exports.getInventoryById = async (req, res) => {
  console.log('Get Inventory by ID called with ID:', req.params.id);
  try {
    const inventoryId = req.params.id;
    const inventory = await Inventory.getInventoryById(inventoryId);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    res.json({
      ...inventory,
      thumbnail_url: inventory.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/inventories/${inventory.thumbnail_image}`
        : null,
    });
  } catch (error) {
    console.error('Get Inventory error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Inventory
exports.updateInventory = async (req, res) => {
  const id = req.params.id;
  const data = req.body; 
  try {
    const existingInventory = await Inventory.getInventoryById(id);
    if (!existingInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    let thumbnailImage = existingInventory.thumbnail_image;
    if (req.file) {
      if (thumbnailImage) {
        const oldImagePath = path.join(__dirname, '../uploads/inventories', thumbnailImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      thumbnailImage = req.file.filename;
    }

    // merge existing + new data
    const updatedData = {
      ...existingInventory,
      ...data,
      thumbnail_image: thumbnailImage,
    };

    await Inventory.updateInventoryById(id, updatedData);

    res.json({ message: 'Inventory updated successfully' });
  } catch (err) {
    console.error('Update Inventory error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get All Inventories
exports.getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.getAllInventories();

    const formatted = inventories.map(inv => ({
      ...inv,
      thumbnail_url: inv.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/inventories/${inv.thumbnail_image}`
        : null,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch Inventories error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Delete Inventory
exports.deleteInventory = async (req, res) => {
  const id = req.params.id;

  try {
    const inventory = await Inventory.getInventoryById(id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.thumbnail_image) {
      const imagePath = path.join(__dirname, '../uploads/inventories', inventory.thumbnail_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Inventory.deleteInventoryById(id);
    res.json({ message: 'Inventory deleted successfully' });
  } catch (err) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};