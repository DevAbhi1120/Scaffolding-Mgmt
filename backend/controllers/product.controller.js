const db = require('../config/db');
const path = require('path');
const fs = require('fs');
// const Product = require('../models/product.model');
const Category = require('../models/categories.model');
const ProductType = require('../models/productType.model');
const Product = require('../models/product.model'); // ensure model import
const Inventory = require('../models/inventory.model'); // ensure model import

exports.createProduct = async (req, res) => {
  const {
    category_id,
    product_type_id,
    name,
    unit,
    stock_quantity,
    price,
    description
  } = req.body;
  try {
    if (!category_id || !name) {
      return res.status(400).json({ message: 'Category and name are required' });
    }

    if (!product_type_id || !name) {
      return res.status(400).json({ message: 'Product type and name are required' });
    }

    const category = await Category.getCategoryById(category_id);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const productType = await ProductType.getProductTypeById(product_type_id);
    if (!productType) {
      return res.status(400).json({ message: 'Invalid product type id' });
    }

    const thumbnail_image = req.file ? req.file.filename : null;
    await Product.createProduct({
      category_id,
      product_type_id,
      name,
      unit,
      stock_quantity: parseInt(stock_quantity) || 0,
      price,
      description,
      thumbnail_image,
      status: 1
    });
    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // format image URL
    product.thumbnail_image = product.thumbnail_image
      ? `${req.protocol}://${req.get('host')}/uploads/product/${product.thumbnail_image}`
      : null;
    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.updateProduct = async (req, res) => {
//   const id = req.params.id;
//   const { category_id, product_type_id, name, unit, stock_quantity, description, status } = req.body;
//   try {
//     const existingProduct = await Product.getProductById(id);
//     if (!existingProduct) {
//       return res.status(404).json({ message: 'Product not found' });
//     }
//     if (category_id && category_id !== existingProduct.category_id) {
//       const category = await Category.getCategoryById(category_id);
//       if (!category) {
//         return res.status(400).json({ message: 'Invalid category_id' });
//       }
//     }
//     if (product_type_id && product_type_id !== existingProduct.product_type_id) {
//       const productType = await ProductType.getProductTypeById(product_type_id);
//       if (!productType) {
//         return res.status(400).json({ message: 'Invalid product type' });
//       }
//     }
//     let thumbnailImage = existingProduct.thumbnail_image;
//     if (req.file) {
//       if (thumbnailImage) {
//         const oldPath = path.resolve(__dirname, "../uploads/product", thumbnailImage);
//         if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//       }
//       thumbnailImage = req.file.filename;
//     }
//     await Product.updateProductById(id, {
//       category_id: category_id ?? existingProduct.category_id,
//       product_type_id: product_type_id ?? existingProduct.product_type_id,
//       name: name ?? existingProduct.name,
//       unit: unit ?? existingProduct.unit,
//       stock_quantity: stock_quantity ?? existingProduct.stock_quantity,
//       price: price ?? existingProduct.price,
//       description: description ?? existingProduct.description,
//       thumbnail_image: thumbnailImage,
//       status: status ?? existingProduct.status, // ✅ fixed for 0
//     });
//     res.json({ message: "Product updated successfully" });
//   } catch (err) {
//     console.error("Update product error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };


exports.updateProduct = async (req, res) => {
  const id = req.params.id;
  const { category_id, product_type_id, name, unit, stock_quantity, price, description, status } = req.body;
  try {
    const existingProduct = await Product.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (category_id && category_id !== existingProduct.category_id) {
      const category = await Category.getCategoryById(category_id);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category_id' });
      }
    }

    if (product_type_id && product_type_id !== existingProduct.product_type_id) {
      const productType = await ProductType.getProductTypeById(product_type_id);
      if (!productType) {
        return res.status(400).json({ message: 'Invalid product type' });
      }
    }

    let thumbnailImage = existingProduct.thumbnail_image;
    if (req.file) {
      if (thumbnailImage) {
        const oldPath = path.resolve(__dirname, "../uploads/product", thumbnailImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      thumbnailImage = req.file.filename;
    }

    await Product.updateProductById(id, {
      category_id: category_id ?? existingProduct.category_id,
      product_type_id: product_type_id ?? existingProduct.product_type_id,
      name: name ?? existingProduct.name,
      unit: unit ?? existingProduct.unit,
      stock_quantity: stock_quantity ?? existingProduct.stock_quantity,
      price: price ?? existingProduct.price,   // ✅ Fixed
      description: description ?? existingProduct.description,
      thumbnail_image: thumbnailImage,
      status: status ?? existingProduct.status,
    });

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const [products, total] = await Promise.all([
      Product.getAllProducts(limit, offset),
      Product.getTotalActiveCount()
    ]);
    const formatted = products.map(p => ({
      ...p,
      thumbnail_image: p.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/product/${p.thumbnail_image}`
        : null
    }));
    console.log("Formatted Products with Category:", formatted);
    res.json({
      success: true,
      total,
      limit,
      offset,
      products: formatted
    });
  } catch (err) {
    console.error('Get all products error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.softDeleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.getProductById(id);
    if (!product || product.status === 0) {
      return res.status(404).json({ message: 'Product not found or already deleted' });
    }
    await Product.softDeleteById(id);
    res.json({ message: 'Product soft deleted successfully' });
  } catch (err) {
    console.error('Soft delete product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.restoreProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.getProductById(id);
    if (!product || product.status === 1) {
      return res.status(404).json({ message: 'Product not found or already active' });
    }
    await Product.restoreById(id);
    res.json({ message: 'Product restored successfully' });
  } catch (err) {
    console.error('Restore product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.deleteProductById(id);
    if (product.thumbnail_image) {
      const imagePath = path.join(__dirname, '../uploads/product', product.thumbnail_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.searchProducts = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  try {
    const results = await Product.searchByName(query);
    const formatted = results.map(p => ({
      ...p,
      thumbnail_image: p.thumbnail_image
        ? `${req.protocol}://${req.get('host')}/uploads/product/${p.thumbnail_image}`
        : null
    }));
    res.json({ success: true, total: formatted.length, products: formatted });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getProductInventory = async (req, res) => {
  console.log("Fetching products with inventory...");
  try {
    const products = await Product.getAllProducts(1000, 0);
    const inventories = await Inventory.getAllInventories();

    // inventories ko product_id ke hisaab se map karo
    const inventoriesMap = {};
    inventories.forEach(item => {
      inventoriesMap[item.product_id] = item.in_stock;
    });

    const productsWithStock = products.map(p => ({
      id: p.id,  
      category_id: p.category_id,
      product_type_id: p.product_type_id,
      thumbnail_image: p.thumbnail_image ? `${req.protocol}://${req.get('host')}/uploads/product/${p.thumbnail_image}` : null,
      name: p.name,
      unit: p.unit,
      stock_quantity: p.stock_quantity,
      price: p.price,
      in_stock: inventoriesMap[p.id] || 0,
    }));

    res.json({ success: true, products: productsWithStock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

