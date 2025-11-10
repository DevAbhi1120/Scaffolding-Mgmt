const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const ProductType = require('../models/productType.model');

exports.createProductType = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Product type name is required' });
    }

    const thumbnailImage = req.file ? req.file.filename : null;

    await ProductType.createProductType({
      name: name.trim(),
      thumbnail_image: thumbnailImage
    });

    res.status(201).json({ message: 'Product type created successfully' });
  } catch (err) {
    console.error('Create product type error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProductTypeById = async (req, res) => {
  try {
    const productTypeId = req.params.id;
    const [rows] = await db.query("SELECT * FROM product_types WHERE id = ?", [productTypeId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product type not found" });
    }
    return res.json(rows[0]); 
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProductType = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  try {
    const existingProductType = await ProductType.getProductTypeById(id);
    if (!existingProductType) {
      return res.status(404).json({ message: 'Product type not found' });
    }
    let thumbnailImage = existingProductType.thumbnail_image;
    if (req.file) {
      if (thumbnailImage) {
        const oldImagePath = path.join(__dirname, '../uploads/productType', thumbnailImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      thumbnailImage = req.file.filename;
    }
    await ProductType.updateProductTypeById(id, {
      name: name || existingProductType.name,
      thumbnail_image: thumbnailImage
    });

    res.json({ message: 'Product type updated successfully' });
  } catch (err) {
    console.error('Update product type error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllProductTypes = async (req, res) => {
  try {
    const productTypes = await ProductType.getAllProductTypes();
    const formatted = productTypes.map(proType => ({
      ...proType,
      thumbnail_url: proType.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/productType/${proType.thumbnail_image}`
        : null
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


exports.deleteProductTypes = async (req, res) => {
  const id = req.params.id;

  try {
    const productType = await ProductType.getProductTypeById(id);
    if (!productType) {
      return res.status(404).json({ message: 'Product type not found' });
    }

    if (productType.thumbnail_image) {
      const imagePath = path.join(__dirname, '../uploads/productType', productType.thumbnail_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await ProductType.deleteProductTypeById(id);
    res.json({ message: 'Product type deleted successfully' });
  } catch (err) {
    console.error('Delete product type error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};