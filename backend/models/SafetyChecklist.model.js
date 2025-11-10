const db = require('../config/db');

const Checklist = {
  createChecklist: async (data) => {
    return db.query(
      "INSERT INTO safety_checklists (order_id, type, check_date, photo, items) VALUES (?, ?, ?, ?, ?)",
      [data.order_id, data.type, data.check_date, data.photo, data.items]
    );
  },

  getChecklistById: async (id) => {
    const [rows] = await db.query("SELECT * FROM safety_checklists WHERE id = ?", [id]);
    return rows[0];
  },

  updateChecklistById: async (id, data) => {
    return db.query(
      "UPDATE safety_checklists SET order_id = ?, type = ?, check_date = ?, photo = ?, items = ? WHERE id = ?",
      [data.order_id, data.type, data.check_date, data.photo, data.items, id]
    );
  },

  getAllChecklist: async () => {
    const [rows] = await db.query("SELECT * FROM safety_checklists");
    return rows;
  },

  deleteChecklistById: async (id) => {
    return db.query("DELETE FROM safety_checklists WHERE id = ?", [id]);
  }
};

module.exports = Checklist;
