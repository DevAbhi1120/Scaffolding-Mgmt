const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyAdmin } = require('../middleware/auth.middleware');
const { productUpload } = require('../middleware/upload.middleware');
// const Product = require('../models/product.model'); // ensure model import
// const Inventory = require('../models/inventory.model'); // ensure model import

router.post('/', verifyAdmin, productUpload.single('thumbnail_image'), productController.createProduct);
router.put('/:id', verifyAdmin, productUpload.single('thumbnail_image'), productController.updateProduct);

// ✅ Updated GET route to include in_stock
// router.get('/', verifyAdmin, async (req, res) => {
//   try {
//     const products = await Product.find(); 
//     const inventories = await Inventory.find(); 

//     // inventories ko product_id ke hisaab se map karo
//     const inventoriesMap = {};
//     inventories.forEach(item => {
//       inventoriesMap[item.product_id] = item.in_stock;
//     });

//     const productsWithStock = products.map(p => ({
//       id: p._id,
//       name: p.name,
//       stock_quantity: p.stock_quantity,
//       price: p.price,
//       in_stock: inventoriesMap[p._id] || 0,
//     }));

//     res.json({ success: true, products: productsWithStock });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
router.get('/', verifyAdmin, productController.getProductInventory);

router.put('/:id/delete', verifyAdmin, productController.softDeleteProduct); //soft delete
router.put('/:id/restore', verifyAdmin, productController.restoreProduct);
router.delete('/:id/permanentDelete', verifyAdmin, productController.deleteProduct);
router.get('/search', verifyAdmin, productController.searchProducts);
router.get('/:id', verifyAdmin, productController.getProductById);

module.exports = router;
