const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const Checklist = require('../models/SafetyChecklist.model');

// ✅ Create Safety Checklist
exports.createChecklist = async (req, res) => {
  const { order_id, type, check_date, items } = req.body;

  try {
    
    if (!order_id || !type || !check_date) {
      return res.status(400).json({ message: 'order_id, type and check_date are required' });
    }

    const photo = req.file ? req.file.filename : null;

    await Checklist.createChecklist({
      order_id,
      type,
      check_date,
      photo,
      items: items ? JSON.stringify(items) : null
    });

    res.status(201).json({ message: 'Checklist created successfully' });
  } catch (err) {
    console.error('Create Checklist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get Checklist By Id
exports.getChecklistById = async (req, res) => {
  try {
    const checklistId = req.params.id;
    const [rows] = await db.query("SELECT * FROM safety_checklists WHERE id = ?", [checklistId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const checklist = rows[0];
    checklist.items = checklist.items ? JSON.parse(checklist.items) : null;
    checklist.photo_url = checklist.photo
      ? `${req.protocol}://${req.get('host')}/uploads/checklist/${checklist.photo}`
      : null;

    return res.json(checklist);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update Checklist
exports.updateChecklist = async (req, res) => {
  const id = req.params.id;
  const { order_id, type, check_date, items } = req.body;

  try {
    const existingChecklist = await Checklist.getChecklistById(id);
    if (!existingChecklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    let photo = existingChecklist.photo;
    if (req.file) {
      if (photo) {
        const oldImagePath = path.join(__dirname, '../uploads/checklist', photo);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      photo = req.file.filename;
    }

    await Checklist.updateChecklistById(id, {
      order_id: order_id || existingChecklist.order_id,
      type: type || existingChecklist.type,
      check_date: check_date || existingChecklist.check_date,
      photo,
      items: items ? JSON.stringify(items) : existingChecklist.items
    });

    res.json({ message: 'Checklist updated successfully' });
  } catch (err) {
    console.error('Update Checklist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get All Checklists (plural fix)
exports.getAllChecklists = async (req, res) => {
  try {
    const checklist = await Checklist.getAllChecklist();
    const formatted = checklist.map(c => ({
      ...c,
      items: c.items ? JSON.parse(c.items) : null,
      photo_url: c.photo
        ? `${req.protocol}://${req.get('host')}/uploads/checklists/${c.photo}`
        : null
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch checklist error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ✅ Delete Checklist
exports.deleteChecklist = async (req, res) => {
  const id = req.params.id;

  try {
    const checklist = await Checklist.getChecklistById(id);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    if (checklist.photo) {
      const imagePath = path.join(__dirname, '../uploads/checklist', checklist.photo);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Checklist.deleteChecklistById(id);
    res.json({ message: 'Checklist deleted successfully' });
  } catch (err) {
    console.error('Delete Checklist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
