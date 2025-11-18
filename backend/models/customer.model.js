const db = require("../config/db");

const Customer = {
  create: (data, callback) => {
    const query = `
      INSERT INTO customers 
      (business_name, address, email, phone, package, notification_email, notification_days) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      query,
      [
        data.business_name,
        data.address,
        data.email,
        data.phone,
        data.package || "PACKAGE_1",
        data.notification_email,
        data.notification_days || 7,
      ],
      callback
    );
  },
  getAll: (callback) =>
    db.query(`SELECT * FROM customers ORDER BY id DESC`, callback),
  getById: (id, callback) =>
    db.query(`SELECT * FROM customers WHERE id = ?`, [id], callback),
  search: (term, callback) => {
    const query = `
      SELECT * FROM customers 
      WHERE business_name LIKE ? OR address LIKE ? OR email LIKE ?`;
    db.query(query, [`%${term}%`, `%${term}%`, `%${term}%`], callback);
  },
  updatePackage: (id, newPackage, callback) => {
    db.query(
      `UPDATE customers SET package = ? WHERE id = ?`,
      [newPackage, id],
      callback
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE customers SET business_name = ?, address = ?, email = ?, phone = ?,
      notification_email = ?, notification_days = ? WHERE id = ?`;
    db.query(
      query,
      [
        data.business_name,
        data.address,
        data.email,
        data.phone,
        data.notification_email,
        data.notification_days,
        id,
      ],
      callback
    );
  },
  delete: (id, callback) =>
    db.query(`DELETE FROM customers WHERE id = ?`, [id], callback),
};

module.exports = Customer;
