const db = require('../config/db');

// Create new order
exports.createOrder = async ({
  user_name,
  order_date,
  user_email,
  notes,
  user_phonenumber,
  user_address,
  status
}) => {
  await db.query(
    `INSERT INTO orders 
      (user_name, order_date, user_email, notes, user_phonenumber, user_address, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [user_name, order_date, user_email, notes, user_phonenumber, user_address, status]
  );
};

// Get order by ID
exports.getOrderById = async (id) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND is_deleted = 0', [id]);
  return rows[0]; // return single order
};

// Update order by ID
exports.updateOrderById = async (
  id,
  { user_name, order_date, user_email, notes, user_phonenumber, user_address, status }
) => {
  await db.query(
    `UPDATE orders 
     SET user_name = ?, order_date = ?, user_email = ?, notes = ?, 
         user_phonenumber = ?, user_address = ?, status = ?, 
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [user_name, order_date, user_email, notes, user_phonenumber, user_address, status, id]
  );
};

// Get all orders
exports.getAllOrders = async () => {
  const [rows] = await db.query('SELECT * FROM orders WHERE is_deleted = 0 ORDER BY created_at DESC');
  return rows;
};

// Soft delete order
exports.deleteOrderById = async (id) => {
  await db.query('UPDATE orders SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
};
