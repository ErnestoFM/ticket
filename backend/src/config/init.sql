-- Ticketmaster MX - Database Initialization
-- MySQL 8.0

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `second_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `mother_last_name` VARCHAR(100) DEFAULT NULL,
  `curp` CHAR(18) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `birth_date` DATE NOT NULL,
  `birth_state` CHAR(2) NOT NULL,
  `gender` ENUM('H','M') NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_curp` (`curp`),
  KEY `idx_users_phone` (`phone`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Venues table
CREATE TABLE IF NOT EXISTS `venues` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `address` VARCHAR(500) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `type` ENUM('teatro','cine','museo') NOT NULL,
  `total_rows` INT NOT NULL DEFAULT 0,
  `total_cols` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_venues_type` (`type`),
  KEY `idx_venues_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seat types table
CREATE TABLE IF NOT EXISTS `seat_types` (
  `id` CHAR(36) NOT NULL,
  `name` ENUM('general','preferente','vip','palco') NOT NULL,
  `color` VARCHAR(7) NOT NULL DEFAULT '#808080',
  `multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seat_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seats table
CREATE TABLE IF NOT EXISTS `seats` (
  `id` CHAR(36) NOT NULL,
  `venue_id` CHAR(36) NOT NULL,
  `seat_type_id` CHAR(36) NOT NULL,
  `row` VARCHAR(5) NOT NULL,
  `col` INT NOT NULL,
  `label` VARCHAR(10) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_seats_venue` (`venue_id`),
  KEY `idx_seats_type` (`seat_type_id`),
  CONSTRAINT `fk_seats_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seats_type` FOREIGN KEY (`seat_type_id`) REFERENCES `seat_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS `events` (
  `id` CHAR(36) NOT NULL,
  `venue_id` CHAR(36) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `type` ENUM('teatro','cine','museo') NOT NULL,
  `date` DATETIME NOT NULL,
  `duration` INT NOT NULL DEFAULT 120 COMMENT 'Duration in minutes',
  `base_price` DECIMAL(10,2) NOT NULL,
  `max_tickets_per_user` INT NOT NULL DEFAULT 4,
  `status` ENUM('activo','cancelado','agotado','finalizado') NOT NULL DEFAULT 'activo',
  `poster_url` VARCHAR(500) DEFAULT NULL,
  `banner_url` VARCHAR(500) DEFAULT NULL,
  `created_by` CHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_venue` (`venue_id`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_date` (`date`),
  KEY `idx_events_type` (`type`),
  CONSTRAINT `fk_events_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),
  CONSTRAINT `fk_events_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservations table
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `event_id` CHAR(36) NOT NULL,
  `seat_id` CHAR(36) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `status` ENUM('held','confirmed','expired','cancelled') NOT NULL DEFAULT 'held',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reservations_user` (`user_id`),
  KEY `idx_reservations_event` (`event_id`),
  KEY `idx_reservations_seat` (`seat_id`),
  KEY `idx_reservations_status` (`status`),
  KEY `idx_reservations_expires` (`expires_at`),
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reservations_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `fk_reservations_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tickets table
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `event_id` CHAR(36) NOT NULL,
  `seat_id` CHAR(36) NOT NULL,
  `reservation_id` CHAR(36) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('stripe','paypal') NOT NULL,
  `payment_intent_id` VARCHAR(255) NOT NULL,
  `qr_code` TEXT DEFAULT NULL,
  `pdf_path` VARCHAR(500) DEFAULT NULL,
  `whatsapp_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tickets_reservation` (`reservation_id`),
  KEY `idx_tickets_user` (`user_id`),
  KEY `idx_tickets_event` (`event_id`),
  KEY `idx_tickets_seat` (`seat_id`),
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_tickets_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `fk_tickets_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`),
  CONSTRAINT `fk_tickets_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Seed seat types
INSERT IGNORE INTO `seat_types` (`id`, `name`, `color`, `multiplier`) VALUES
  (UUID(), 'general',    '#808080', 1.00),
  (UUID(), 'preferente', '#4169E1', 1.50),
  (UUID(), 'vip',        '#FFD700', 2.50),
  (UUID(), 'palco',      '#8B0000', 4.00);
