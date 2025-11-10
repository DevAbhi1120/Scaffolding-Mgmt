// models/inventory.model.js
const db = require('../config/db');

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
  const [rows] = await db.query('SELECT * FROM inventories WHERE id = ?', [id]);
  return rows[0];
};

// UPDATE inventory record
exports.updateInventoryById = async (
  id,
  { product_id, opening_stock, stock_in, stock_out, missing, damaged}
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


// DELETE by ID
exports.deleteInventoryById = async (id) => {
  await db.query('DELETE FROM inventories WHERE id = ?', [id]);
};
