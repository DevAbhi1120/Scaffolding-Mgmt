const db = require("../config/db");
const Order = require("../models/orders.model");
const OrderItem = require("../models/orderItems.model");
const { InventoryTransaction } = require("../models/inventory.model");
const { requireP2 } = require("../middleware/package.middleware");

exports.createOrder = async (req, res) => {
  const {
    user_name,
    user_email,
    user_phonenumber,
    user_address,
    order_date,
    notes,
    status,
    items,
  } = req.body;

  // ✅ Validate required fields
  if (
    !user_name ||
    !user_email ||
    !user_phonenumber ||
    !user_address ||
    !order_date
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // ✅ Generate order number (ORDNO-001 format)
    const [lastOrder] = await conn.query(
      "SELECT order_number FROM orders ORDER BY id DESC LIMIT 1"
    );

    let nextNo = 1;
    if (lastOrder.length > 0) {
      const lastNum = parseInt(lastOrder[0].order_number.replace("ORDNO-", ""));
      nextNo = lastNum + 1;
    }

    const order_number = `ORDNO-${nextNo.toString().padStart(3, "0")}`;
    const userId = req.user?.id || null;

    // ✅ Insert into orders
    const [orderResult] = await conn.query(
      `INSERT INTO orders 
        (order_number, user_id, user_name, user_email, user_phonenumber, user_address, order_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        userId,
        user_name,
        user_email,
        user_phonenumber,
        user_address,
        order_date,
        notes || null,
        status || "DRAFT",
      ]
    );

    const orderId = orderResult.insertId;

    // ✅ Insert items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !item.qty) {
          await conn.rollback();
          return res
            .status(400)
            .json({ message: "Each item must have product_id and qty" });
        }
      }

      // ✅ Insert into order_items
      const itemValues = items.map((item) => [
        orderId,
        item.product_id,
        item.stock_quantity || 0,
        item.qty,
      ]);

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, stock_quantity, order_qty) VALUES ?`,
        [itemValues]
      );

      // ✅ Update stock and log inventory transactions for P2+
      if (req.customerPackage >= 2) {
        for (const item of items) {
          const [productRows] = await conn.query(
            "SELECT stock_quantity FROM products WHERE id = ?",
            [item.product_id]
          );

          if (!productRows.length) {
            await conn.rollback();
            return res
              .status(404)
              .json({ message: `Product ${item.product_id} not found` });
          }

          const availableStock = productRows[0].stock_quantity;
          if (availableStock < item.qty) {
            await conn.rollback();
            return res.status(400).json({
              message: `Insufficient stock for product ID ${item.product_id}`,
            });
          }

          // ✅ Deduct stock
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
            [item.qty, item.product_id]
          );

          // ✅ Record inventory transaction (OUT)
          await InventoryTransaction.create({
            product_id: item.product_id,
            order_id: orderId,
            type: "OUT",
            quantity: item.qty,
            user_id: userId,
          });

          await InventoryTransaction.updateBalance(item.product_id, -item.qty);
        }
      } else {
        // ✅ If below P2, just deduct stock but no inventory logs
        for (const item of items) {
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
            [item.qty, item.product_id]
          );
        }
      }
    }

    // ✅ Commit transaction
    await conn.commit();

    // ✅ Fetch order with items
    const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);
    const [orderItems] = await conn.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );

    res.status(201).json({
      message: "Order created successfully",
      order: { ...orderRows[0], items: orderItems },
    });
  } catch (err) {
    await conn.rollback();
    console.error("Create Order error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  db.query(
    `UPDATE orders SET status = ? WHERE id = ?`,
    [status, orderId],
    (err) => {
      if (err) return res.status(500).json(err);
      if (
        req.customerPackage >= 2 &&
        (status === "COMPLETED" || status === "CANCELLED")
      ) {
        // Auto return stock
        db.query(
          `SELECT * FROM order_items WHERE order_id = ?`,
          [orderId],
          (err, items) => {
            items.forEach((item) => {
              InventoryTransaction.create(
                {
                  product_id: item.product_id,
                  order_id: orderId,
                  type: "IN",
                  quantity: item.order_qty,
                  user_id: req.user.id,
                },
                () => {}
              );
              InventoryTransaction.updateBalance(
                item.product_id,
                +item.order_qty,
                () => {}
              );
            });
          }
        );
      }
      res.json({ message: "Status updated" });
    }
  );
};

exports.extendDeadline = (req, res) => {
  const { extended_date } = req.body;
  db.query(
    `UPDATE orders SET extended_date = ? WHERE id = ?`,
    [extended_date, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Deadline extended" });
    }
  );
};

// exports.createOrder = async (req, res) => {
//   const { user_name, user_email, user_phonenumber, user_address, order_date, notes, status, items } = req.body;

//   if (!user_name || !user_email || !user_phonenumber || !user_address || !order_date) {
//     return res.status(400).json({ message: 'Required fields are missing' });
//   }

//   const conn = await db.getConnection();
//   await conn.beginTransaction();

//   try {
//     // ✅ Generate order number in format ORDNO-001
//     const [lastOrder] = await conn.query("SELECT id FROM orders ORDER BY id DESC LIMIT 1");
//     const order_number = `ORDNO-${(lastOrder.length ? lastOrder[0].id + 1 : 1).toString().padStart(3, '0')}`;
//     const userId = req.user.id;

//     const [orderResult] = await conn.query(
//       `INSERT INTO orders
//         (order_number, user_id, user_name, user_email, user_phonenumber, user_address, order_date, notes, status)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [order_number, userId, user_name, user_email, user_phonenumber, user_address, order_date, notes || null, status || "DRAFT"]
//     );

//     const orderId = orderResult.insertId;

//     if (items && Array.isArray(items) && items.length > 0) {
//       for (const item of items) {
//         if (!item.product_id || !item.qty) {
//           await conn.rollback();
//           return res.status(400).json({ message: 'Each item must have product_id and qty' });
//         }
//       }

//       const itemValues = items.map(item => [orderId, item.product_id, item.stock_quantity || 0, item.qty]);
//       await conn.query(
//         `INSERT INTO order_items (order_id, product_id, stock_quantity, order_qty) VALUES ?`,
//         [itemValues]
//       );

//       const stockPromises = items.map(item =>
//         conn.query(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.qty, item.product_id])
//       );
//       await Promise.all(stockPromises);
//     }

//     await conn.commit();

//     const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ?", [orderId]);
//     const [orderItems] = await conn.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

//     res.status(201).json({
//       message: "Order created successfully",
//       order: { ...orderRows[0], items: orderItems }
//     });

//   } catch (err) {
//     await conn.rollback();
//     console.error("Create Order error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   } finally {
//     conn.release();
//   }
// };

// exports.createOrder = async (req, res) => {
//   const { user_name, user_email, user_phonenumber, user_address, order_date, notes, status, items } = req.body;

//   if (!user_name || !user_email || !user_phonenumber || !user_address || !order_date) {
//     return res.status(400).json({ message: 'Required fields are missing' });
//   }

//   const conn = await db.getConnection();
//   await conn.beginTransaction();

//   try {
//     // Generate order number
//     const [lastOrder] = await conn.query("SELECT id FROM orders ORDER BY id DESC LIMIT 1");
//     const order_no = `ORD-${(lastOrder.length ? lastOrder[0].id + 1 : 1).toString().padStart(5, '0')}`;
//     const userId = req.user.id;
//     // Insert order
//     const [orderResult] = await conn.query(
//       `INSERT INTO orders (user_id, user_name, user_email, user_phonenumber, user_address, order_date, notes, status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [userId, user_name, user_email, user_phonenumber, user_address, order_date, notes || null, status || "DRAFT"]
//     );

//     const orderId = orderResult.insertId;

//     // Insert order items if any
//     if (items && Array.isArray(items) && items.length > 0) {
//       // Validate each item
//       for (const item of items) {
//         if (!item.product_id || !item.qty) {
//           await conn.rollback();
//           return res.status(400).json({ message: 'Each item must have product_id and qty' });
//         }
//       }

//       // Batch insert order items
//       const itemValues = items.map(item => [orderId, item.product_id, item.stock_quantity || 0, item.qty]);
//       await conn.query(
//         `INSERT INTO order_items (order_id, product_id, stock_quantity, order_qty) VALUES ?`,
//         [itemValues]
//       );

//       // Update product stock
//       const stockPromises = items.map(item =>
//         conn.query(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.qty, item.product_id])
//       );
//       await Promise.all(stockPromises);
//     }

//     await conn.commit();

//     // Fetch full order details including items
//     const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ?", [orderId]);
//     const [orderItems] = await conn.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

//     res.status(201).json({ message: "Order created successfully", order: { ...orderRows[0], items: orderItems } });

//   } catch (err) {
//     await conn.rollback();
//     console.error("Create Order error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   } finally {
//     conn.release();
//   }
// };

// Get single order
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (!orders.length)
      return res.status(404).json({ message: "Order not found" });

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );
    res.json({ ...orders[0], items });
  } catch (err) {
    console.error("Get order error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Update order (basic, without items update)
exports.updateOrder = async (req, res) => {
  const id = req.params.id;
  const {
    user_name,
    user_email,
    user_phonenumber,
    user_address,
    order_date,
    notes,
    status,
    items,
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Check if order exists
    const [existingOrders] = await conn.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );
    if (!existingOrders.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    // Update main order details
    await conn.query(
      `UPDATE orders 
       SET user_name=?, user_email=?, user_phonenumber=?, user_address=?, order_date=?, notes=?, status=? 
       WHERE id=?`,
      [
        user_name || existingOrders[0].user_name,
        user_email || existingOrders[0].user_email,
        user_phonenumber || existingOrders[0].user_phonenumber,
        user_address || existingOrders[0].user_address,
        order_date || existingOrders[0].order_date,
        notes || existingOrders[0].notes,
        status || existingOrders[0].status,
        id,
      ]
    );

    // Handle items
    if (items && Array.isArray(items)) {
      // Get old items
      const [oldItems] = await conn.query(
        "SELECT * FROM order_items WHERE order_id=?",
        [id]
      );

      // Convert oldItems to map for quick lookup
      const oldMap = {};
      oldItems.forEach((item) => {
        oldMap[item.product_id] = item;
      });

      // Track processed product_ids
      const processed = new Set();

      for (const item of items) {
        if (!item.product_id || !item.qty) {
          await conn.rollback();
          return res
            .status(400)
            .json({ message: "Each item must have product_id and qty" });
        }

        if (oldMap[item.product_id]) {
          // Product already exists → update qty
          const oldQty = oldMap[item.product_id].order_qty;
          const diff = item.qty - oldQty;

          await conn.query(
            "UPDATE order_items SET order_qty=?, stock_quantity=? WHERE order_id=? AND product_id=?",
            [item.qty, item.stock_quantity || 0, id, item.product_id]
          );

          // Update stock (adjust difference)
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id=?",
            [diff, item.product_id]
          );
        } else {
          // New product → insert
          await conn.query(
            "INSERT INTO order_items (order_id, product_id, stock_quantity, order_qty) VALUES (?, ?, ?, ?)",
            [id, item.product_id, item.stock_quantity || 0, item.qty]
          );

          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id=?",
            [item.qty, item.product_id]
          );
        }

        processed.add(item.product_id);
      }

      // Remove products which are not in new list
      for (const oldItem of oldItems) {
        if (!processed.has(oldItem.product_id)) {
          // Restore stock
          await conn.query(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id=?",
            [oldItem.order_qty, oldItem.product_id]
          );

          // Delete from order_items
          await conn.query(
            "DELETE FROM order_items WHERE order_id=? AND product_id=?",
            [id, oldItem.product_id]
          );
        }
      }
    }

    await conn.commit();

    // Fetch updated order
    const [orderRows] = await conn.query("SELECT * FROM orders WHERE id=?", [
      id,
    ]);
    const [orderItems] = await conn.query(
      "SELECT * FROM order_items WHERE order_id=?",
      [id]
    );

    res.json({
      message: "Order updated successfully",
      order: { ...orderRows[0], items: orderItems },
    });
  } catch (err) {
    await conn.rollback();
    console.error("Update Order error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

exports.viewOrder = async (req, res) => {
  const id = req.params.id;

  try {
    // Order details fetch
    const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);

    if (!orders.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    // Order items ke saath product info bhi fetch karna
    const [items] = await db.query(
      `SELECT 
          oi.id, 
          oi.order_id, 
          oi.product_id, 
          oi.order_qty, 
          oi.stock_quantity,
          p.name AS product_name, 
          p.price AS price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      message: "Order fetched successfully",
      order: {
        ...order,
        items,
      },
    });
  } catch (err) {
    console.error("View Order error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete order (soft delete)
exports.deleteOrder = async (req, res) => {
  const id = req.params.id;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ?", [
      id,
    ]);
    if (!orderRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    // Get order_items of this order
    const [orderItems] = await conn.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );

    // Restore stock for each product
    for (const item of orderItems) {
      await conn.query(
        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
        [item.order_qty, item.product_id]
      );
    }

    // Delete order_items first
    await conn.query("DELETE FROM order_items WHERE order_id = ?", [id]);

    // Delete the main order
    await conn.query("DELETE FROM orders WHERE id = ?", [id]);

    await conn.commit();
    res.json({ message: "Order and items deleted successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Delete Order error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};
