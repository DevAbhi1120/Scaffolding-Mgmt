const db = require('../config/db');

const SWMS = {
  create: (data, callback) => {
    const query = `INSERT INTO swms (order_id, data, submitted_by) VALUES (?, ?, ?)`;
    db.query(query, [data.order_id, JSON.stringify(data.formData), data.submitted_by], callback);
  },
  getByOrder: (orderId, callback) => db.query(`SELECT * FROM swms WHERE order_id = ? ORDER BY submitted_at DESC`, [orderId], callback),
  update: (id, data, callback) => {
    db.query(`UPDATE swms SET data = ? WHERE id = ?`, [JSON.stringify(data), id], callback);
  }
};

module.exports = SWMS;