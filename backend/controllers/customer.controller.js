const Customer = require("../models/customer.model");

exports.create = (req, res) => {
  Customer.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(201).json({ id: result.insertId, message: "Customer created" });
  });
};

exports.getAll = (req, res) => {
  Customer.getAll((err, customers) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(customers);
  });
};

exports.search = (req, res) => {
  const term = req.query.term || "";
  Customer.search(term, (err, customers) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(customers);
  });
};

exports.upgradePackage = (req, res) => {
  const { package: newPackage } = req.body;
  if (!["PACKAGE_1", "PACKAGE_2", "PACKAGE_3"].includes(newPackage)) {
    return res.status(400).json({ error: "Invalid package" });
  }
  Customer.updatePackage(req.params.id, newPackage, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Package upgraded" });
  });
};

exports.update = (req, res) => {
  Customer.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Customer updated" });
  });
};

exports.delete = (req, res) => {
  Customer.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Customer deleted" });
  });
};
