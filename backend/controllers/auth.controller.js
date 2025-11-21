const bcrypt = require('bcryptjs');
const validator = require('validator');
const { generateToken } = require('../config/jwt.config');
const { createUser, getUserByEmail } = require('../models/user.model');

exports.register = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;
    const phone = (req.body.phone || "").trim();
    const role = (req.body.role || "user").trim();

    const errors = {};

    // Basic validation
    if (!validator.isEmail(email)) errors.email = "Invalid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters";

    if (phone && !/^[+]?[\d]{7,15}$/.test(phone))
      errors.phone = "Invalid phone number";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: "Validation error", errors });
    }

    // Check duplicate email
    const exists = await getUserByEmail(email);
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);

    const userId = await createUser(name, email, hashed, role, phone);

    const token = generateToken({ id: userId, name, email, role });

    res.status(201).json({
      success: true,
      message: "Register successful",
      token,
      user: { id: userId, name, email, role, phone }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await getUserByEmail(email);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
