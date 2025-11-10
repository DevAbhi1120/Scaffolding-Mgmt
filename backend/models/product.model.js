
const db = require('../config/db');

exports.createProduct = async ({
  category_id,
  product_type_id,
  name,
  unit,
  stock_quantity,
  price,
  description,
  thumbnail_image,
  status
}) => {
  await db.query(
    `INSERT INTO products
     (category_id, product_type_id, name, unit, stock_quantity, price, description, thumbnail_image, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [category_id, product_type_id, name, unit, stock_quantity, price, description, thumbnail_image, status]
  );
};

exports.updateProductById = async (id, data) => {
  const [result] = await db.query(
    `UPDATE products 
     SET category_id=?, 
         product_type_id=?, 
         name=?, 
         unit=?, 
         stock_quantity=?, 
         price=?,
         description=?, 
         thumbnail_image=?, 
         status=?, 
         updated_at = CURRENT_TIMESTAMP
     WHERE id=?`,
    [
      data.category_id,
      data.product_type_id,
      data.name,
      data.unit,
      data.stock_quantity,
      data.price,
      data.description,
      data.thumbnail_image,
      data.status,
      id,
    ]
  );
  return result;
};

exports.getProductById = async (id) => {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
};

exports.updateProductById = async (id, data) => {
  const [result] = await db.query(
    `UPDATE products 
     SET category_id=?, product_type_id=?, name=?, unit=?, stock_quantity=?, price=?, description=?, thumbnail_image=?, status=? 
     WHERE id=?`,
    [
      data.category_id,
      data.product_type_id,
      data.name,
      data.unit,
      data.stock_quantity,
      data.price,
      data.description,
      data.thumbnail_image,
      data.status,
      id,
    ]
  );
  return result;
};

exports.softDeleteById = async (id) => {
  await db.query(
    `UPDATE products SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
};

// exports.getAllProducts = async (limit, offset) => {
//   const [rows] = await db.query(
//     `SELECT p.*, c.name AS category_name
//      FROM products p
//      LEFT JOIN product_categories c ON p.category_id = c.id
//      WHERE p.status = 1
//      ORDER BY p.created_at DESC
//      LIMIT ? OFFSET ?`,
//     [limit, offset]
//   );
//   return rows;
// };

exports.getAllProducts = async (limit = 1000, offset = 0) => {
  const [rows] = await db.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN product_categories c ON p.category_id = c.id
     WHERE p.status = 1
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
};

exports.getTotalActiveCount = async () => {
  const [rows] = await db.query(`SELECT COUNT(*) as total FROM products WHERE status = 1`);
  return rows[0].total;
};

exports.restoreById = async (id) => {
  await db.query(
    `UPDATE products SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
};

exports.deleteProductById = async (id) => {
  await db.query('DELETE FROM products WHERE id = ?', [id]);
};


exports.searchByName = async (searchTerm) => {
  const likeTerm = `%${searchTerm}%`;
  const [rows] = await db.query(
    `SELECT * FROM products WHERE status = 1 AND name LIKE ? ORDER BY created_at DESC`,
    [likeTerm]
  );
  return rows;
};
