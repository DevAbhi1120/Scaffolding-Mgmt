const db = require('../config/db');

exports.createCategory = async ({ name, thumbnail_image }) => {
  await db.query(
    `INSERT INTO product_categories (name, thumbnail_image, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [name, thumbnail_image]
  );
};


exports.getCategoryById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product_categories WHERE id = ?', [id]);
  return rows[0]; // Return single object
};

exports.updateCategoryById = async (id, { name, thumbnail_image }) => {
  await db.query(
    `UPDATE product_categories
     SET name = ?, thumbnail_image = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, thumbnail_image, id]
  );
};

exports.getAllCategories = async () => {
  const [rows] = await db.query('SELECT * FROM product_categories ORDER BY created_at DESC');
  return rows;
};

exports.deleteCategoryById = async (id) => {
  await db.query('DELETE FROM product_categories WHERE id = ?', [id]);
};