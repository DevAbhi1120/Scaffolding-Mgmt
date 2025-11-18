// models/inventory.model.js
const db = require("../config/db");

// CREATE inventory record
exports.createInventory = async ({
  product_id,
  opening_stock,
  stock_in,
  stock_out,
  missing,
  damaged,
}) => {
  await db.query(
    `INSERT INTO inventories 
    (product_id, opening_stock, stock_in, stock_out, missing, damaged, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [product_id, opening_stock, stock_in, stock_out, missing, damaged]
  );
};

// READ by ID
exports.getInventoryById = async (id) => {
  const [rows] = await db.query("SELECT * FROM inventories WHERE id = ?", [id]);
  return rows[0];
};

// UPDATE inventory record
exports.updateInventoryById = async (
  id,
  { product_id, opening_stock, stock_in, stock_out, missing, damaged }
) => {
  await db.query(
    `UPDATE inventories
     SET product_id = ?,
         opening_stock = ?,
         stock_in = ?,
         stock_out = ?,
         missing = ?,
         damaged = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [product_id, opening_stock, stock_in, stock_out, missing, damaged, id]
  );
};

exports.getAllInventories = async () => {
  const [rows] = await db.query(`
    SELECT i.*, p.name AS product_name
    FROM inventories i
    JOIN products p ON i.product_id = p.id
    ORDER BY i.created_at DESC
  `);
  return rows;
};

exports.InventoryTransaction = {
  create: (data, callback) => {
    const query = `INSERT INTO inventory_transactions (product_id, order_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(
      query,
      [
        data.product_id,
        data.order_id,
        data.type,
        data.quantity,
        data.reason,
        data.user_id,
      ],
      callback
    );
  },
  updateBalance: (productId, delta, callback) => {
    // delta: + for IN, - for OUT
    db.query(
      `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + ?) WHERE id = ?`,
      [delta, productId],
      callback
    );
    // Also update aggregated inventories table if needed
    db.query(
      `UPDATE inventories SET balance = balance + ? WHERE product_id = ?`,
      [delta, productId],
      (err) => callback(err)
    );
  },
  getHistory: (productId, callback) =>
    db.query(
      `SELECT * FROM inventory_transactions WHERE product_id = ? ORDER BY date DESC`,
      [productId],
      callback
    ),
};


// DELETE by ID
exports.deleteInventoryById = async (id) => {
  await db.query("DELETE FROM inventories WHERE id = ?", [id]);
};

