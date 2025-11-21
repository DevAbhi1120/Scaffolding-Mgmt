ALTER TABLE `order_items`
  ADD COLUMN `returned_qty` int(11) DEFAULT 0 AFTER `order_qty`,
  ADD COLUMN `damaged_qty` int(11) DEFAULT 0,
  ADD COLUMN `lost_qty` int(11) DEFAULT 0,
  ADD COLUMN `assigned_date` datetime DEFAULT current_timestamp(),
  ADD COLUMN `return_date` datetime NULL;

CREATE TABLE `client_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `assigned_qty` int(11) DEFAULT 0,
  `returned_qty` int(11) DEFAULT 0,
  `damaged_qty` int(11) DEFAULT 0,
  `lost_qty` int(11) DEFAULT 0,
  `balance` int(11) DEFAULT 0,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_client_cust` (`customer_id`),
  KEY `fk_client_prod` (`product_id`),
  CONSTRAINT `fk_client_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_client_prod` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_number` varchar(100) UNIQUE NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `balance_due` decimal(10,2) GENERATED ALWAYS AS (`amount` - `paid_amount`) STORED,
  `due_date` date NOT NULL,
  `status` enum('DRAFT','ISSUED','PAID','PARTIAL','OVERDUE') DEFAULT 'DRAFT',
  `pdf_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_inv_order` (`order_id`),
  KEY `fk_inv_cust` (`customer_id`),
  CONSTRAINT `fk_inv_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('CASH','CARD','BANK','CHEQUE') NOT NULL,
  `receipt_number` varchar(100) UNIQUE,
  `voucher_type` enum('PAYMENT','RECEIPT') DEFAULT 'PAYMENT',
  `date` datetime DEFAULT current_timestamp(),
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `fk_pay_inv` (`invoice_id`),
  KEY `fk_pay_cust` (`customer_id`),
  CONSTRAINT `fk_pay_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pay_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
CREATE TRIGGER after_order_complete
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO invoices (order_id, customer_id, invoice_number, amount, due_date)
    SELECT NEW.id, NEW.customer_id, CONCAT('INV-', NEW.id, '-', YEAR(NEW.updated_at), MONTH(NEW.updated_at)),
           SUM(p.price * oi.order_qty), DATE_ADD(NEW.end_date, INTERVAL 30 DAY)
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = NEW.id
    GROUP BY oi.order_id;
  END IF;
END//
DELIMITER ;

CREATE INDEX `idx_payments_customer` ON payments (customer_id, date);
CREATE INDEX `idx_client_inv_balance` ON client_inventory (customer_id, product_id, balance);