const db = require('../config/db');

// Create a new order item
exports.createOrderItem = async ({ order_id, product_id, stock_quantity, order_qty, thumbnail_image }) => {
  await db.query(
    `INSERT INTO order_items 
      (order_id, product_id, stock_quantity, order_qty, thumbnail_image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [order_id, product_id, stock_quantity, order_qty, thumbnail_image]
  );
};

// Get single order item by ID
exports.getOrderItemById = async (id) => {
  const [rows] = await db.query('SELECT * FROM order_items WHERE id = ?', [id]);
  return rows[0];
};

// Update order item by ID
exports.updateOrderItemById = async (id, { order_id, product_id, stock_quantity, order_qty, thumbnail_image }) => {
  await db.query(
    `UPDATE order_items
     SET order_id = ?, product_id = ?, stock_quantity = ?, order_qty = ?, thumbnail_image = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [order_id, product_id, stock_quantity, order_qty, thumbnail_image, id]
  );
};

// Get all order items
exports.getAllOrderItems = async () => {
  const [rows] = await db.query('SELECT * FROM order_items ORDER BY created_at DESC');
  return rows;
};

// Delete order item by ID
exports.deleteOrderItemById = async (id) => {
  await db.query('DELETE FROM order_items WHERE id = ?', [id]);
};
