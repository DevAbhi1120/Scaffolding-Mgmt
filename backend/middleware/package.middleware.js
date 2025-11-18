const db = require('../config/db');

const checkPackage = (minPackage) => (req, res, next) => {
  let customerId = req.body.customer_id || req.params.customerId || req.query.customer_id;
  
  if (!customerId) {
    // Fallback: if order_id provided, get from order
    const orderId = req.body.order_id || req.params.orderId;
    if (orderId) {
      db.query(`SELECT customer_id FROM orders WHERE id = ?`, [orderId], (err, result) => {
        if (err || !result[0]) return res.status(400).json({ error: 'Order not found' });
        customerId = result[0].customer_id;
        checkCustomerPackage();
      });
      return;
    }
    return res.status(400).json({ error: 'Customer ID required' });
  } else {
    checkCustomerPackage();
  }

  function checkCustomerPackage() {
    if (!customerId) return res.status(400).json({ error: 'No customer' });
    db.query(`SELECT package FROM customers WHERE id = ?`, [customerId], (err, result) => {
      if (err || !result[0]) return res.status(404).json({ error: 'Customer not found' });
      const packages = { PACKAGE_1: 1, PACKAGE_2: 2, PACKAGE_3: 3 };
      if (packages[result[0].package] < packages[minPackage]) {
        return res.status(403).json({ error: `Requires ${minPackage} or higher` });
      }
      req.customerPackage = result[0].package; // for later use
      next();
    });
  }
};

module.exports = {
  requireP2: checkPackage('PACKAGE_2'),
  requireP3: checkPackage('PACKAGE_3')
};