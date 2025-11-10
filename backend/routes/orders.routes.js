// routes/orders.routes.js
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { verifyAdmin } = require('../middleware/auth.middleware');
const orderUpload = require('../middleware/order.middleware');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, ordersController.createOrder);
// Create order
router.post('/', verifyAdmin, orderUpload.single('thumbnail_image'), ordersController.createOrder);

// Update order
router.put('/:id', verifyAdmin, orderUpload.single('thumbnail_image'), ordersController.updateOrder);

// Get all orders
router.get('/', verifyAdmin, ordersController.getAllOrders);

// Get single order
router.get('/:id', verifyAdmin, ordersController.getOrderById);

router.get('/:id', verifyAdmin, ordersController.viewOrder);

// Delete order
router.delete('/:id', verifyAdmin, ordersController.deleteOrder);

module.exports = router;
