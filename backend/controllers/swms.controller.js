const SWMS = require("../models/swms.model");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.submit = (req, res) => {
  SWMS.create(req.body, (err, result) => {
    if (err) return res.status(500).json(err);
    // Email all admins
    db.query(`SELECT email FROM users WHERE role = 'admin'`, (err, admins) => {
      admins.forEach((admin) => {
        transporter.sendMail({
          to: admin.email,
          subject: `New SWMS Submitted for Order ${req.body.order_id}`,
          text: `SWMS ID: ${result.insertId}. View in dashboard.`,
        });
      });
    });
    res.status(201).json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  SWMS.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "SWMS updated" });
  });
};
