CREATE TABLE `inventory_items` (
  `id` varchar(36) NOT NULL,
  `productId` varchar(36) NOT NULL,
  `serialNumber` varchar(200) DEFAULT NULL,
  `status` enum('IN_STORE','ASSIGNED','DAMAGED','LOST') NOT NULL DEFAULT 'IN_STORE',
  `assignedToOrderId` varchar(36) DEFAULT NULL,
  `siteAddress` varchar(300) DEFAULT NULL,
  `codeNo` varchar(100) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_inventory_items_productId` (`productId`),
  CONSTRAINT `FK_inventory_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_movements` (
  `id` varchar(36) NOT NULL,
  `productId` varchar(36) NOT NULL,
  `quantity` int NOT NULL DEFAULT 0,
  `movementType` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `referenceId` varchar(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_inventory_movements_productId` (`productId`),
  CONSTRAINT `FK_inventory_movements_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
