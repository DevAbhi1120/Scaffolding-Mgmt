const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt.config');
const { createUser, getUserByEmail,authenticateUserByEmail} = require('../models/user.model');


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authenticateUserByEmail(email, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, name:user.name, email: user.email, role: user.role });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.register = async (req, res) => {
  const { name, email, password, phone, role = 'user' } = req.body;

    // ✅ Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user with the same email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: email });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const userId = await createUser(name, email, hashedPassword, role, phone);

    // Generate JWT token
    const token = generateToken({ id: userId, name, email, role });

    res.status(201).json({
      message: 'Register successful',
      token,
      user: {
        id: userId,
        name,
        email,
        role,
        phone
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};