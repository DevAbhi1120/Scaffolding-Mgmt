const db = require('../config/db');

exports.createProductType = async ({ name, thumbnail_image }) => {
  await db.query(
    `INSERT INTO product_types (name, thumbnail_image, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [name, thumbnail_image]
  );
};

exports.getProductTypeById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product_types WHERE id = ?', [id]);
  return rows[0]; 
};

exports.updateProductTypeById = async (id, { name, thumbnail_image }) => {
  await db.query(
    `UPDATE product_types
     SET name = ?, thumbnail_image = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, thumbnail_image, id]
  );
};

exports.getAllProductTypes = async () => {
  const [rows] = await db.query('SELECT * FROM product_types ORDER BY created_at DESC');
  return rows;
};

exports.deleteProductTypeById = async (id) => {
  await db.query('DELETE FROM product_types WHERE id = ?', [id]);
};