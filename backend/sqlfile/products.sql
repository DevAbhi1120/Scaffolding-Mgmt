CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(50),
  `stock_quantity` INT DEFAULT 0,
  `description` TEXT,
  `thumbnail_image` VARCHAR(255) DEFAULT NULL,
  `status` TINYINT(1) DEFAULT 1, -- 1 = active, 0 = deleted
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`)
);
