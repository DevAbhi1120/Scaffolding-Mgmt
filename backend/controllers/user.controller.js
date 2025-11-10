// controllers/user.controller.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

exports.getAllUsers = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    
    const users = await User.getAllUsers(limit, offset);
    const total = await User.countAllUsers();

    // Format profile_image as full URL
    const formatted = users.map(p => ({
      ...p,
      profile_image: p.profile_image
        ? `${req.protocol}://${req.get('host')}/uploads/profile/${p.profile_image}`
        : null
    }));

    res.json({
      success: true,
      total,
      limit,
      offset,
      users: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


exports.getUsers = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.getUserById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Format profile_image as full URL
    const formatted = {
      ...user,
      profile_image: user.profile_image
        ? `${req.protocol}://${req.get('host')}/uploads/profile/${user.profile_image}`
        : null
    };

    res.json({ success: true, user: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const {
    name,
    email,
    password,
    role,
    phone
  } = req.body;

  try {
    const existingUser = await User.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use old values if fields are missing
    const updatedName = name || existingUser.name;
    const updatedEmail = email || existingUser.email;
    const updatedRole = role || existingUser.role;
    const updatedPhone = phone || existingUser.phone;

    // Hash new password if provided, else use existing one
    let hashedPassword = existingUser.password;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Handle profile image
    let profileImage = existingUser.profile_image;
    if (req.file) {
      // Delete old image if it exists
      if (profileImage) {
        const oldPath = path.join(__dirname, '../uploads/profile', profileImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      profileImage = req.file.filename;
    }

    // Perform update
    await User.updateUserById(id, {
      name: updatedName,
      email: updatedEmail,
      password: hashedPassword,
      role: updatedRole,
      phone: updatedPhone,
      profile_image: profileImage
    });

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



// PUT /api/user/:id/delete
exports.softDeleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.softDeleteUserById(id);

    res.json({ message: 'User soft deleted successfully' });
  } catch (err) {
    console.error('Soft delete error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.restoreUser = async (req, res) => {
  const id = req.params.id;

  try {
    await User.restoreUserById(id);
    res.json({ message: 'User restored successfully' });
  } catch (err) {
    console.error('Restore user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.searchUser = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const results = await User.searchUsers(q);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};