const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const Category = require('../models/categories.model');

exports.createCategory = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const thumbnailImage = req.file ? req.file.filename : null;

    await Category.createCategory({
      name: name.trim(),
      thumbnail_image: thumbnailImage
    });

    res.status(201).json({ message: 'Category created successfully' });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [rows] = await db.query("SELECT * FROM product_categories WHERE id = ?", [categoryId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json(rows[0]); 
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCategory = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  try {
    const existingCategory = await Category.getCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    let thumbnailImage = existingCategory.thumbnail_image;
    if (req.file) {
      if (thumbnailImage) {
        const oldImagePath = path.join(__dirname, '../uploads/categories', thumbnailImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      thumbnailImage = req.file.filename;
    }
    await Category.updateCategoryById(id, {
      name: name || existingCategory.name,
      thumbnail_image: thumbnailImage
    });

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    const formatted = categories.map(cat => ({
      ...cat,
      thumbnail_url: cat.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/categories/${cat.thumbnail_image}`
        : null
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


exports.deleteCategories = async (req, res) => {
  const id = req.params.id;

  try {
    const category = await Category.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.thumbnail_image) {
      const imagePath = path.join(__dirname, '../uploads/categories', category.thumbnail_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.deleteCategoryById(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};