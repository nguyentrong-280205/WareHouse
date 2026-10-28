-- CreateTable
CREATE TABLE `KhachHang` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KhachHang_code_key`(`code`),
    INDEX `KhachHang_email_idx`(`email`),
    INDEX `KhachHang_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `VaiTroQuyen` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `VaiTroQuyen_code_key`(`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `Quyen` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `Quyen_code_key`(`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `VaiTro_Quyen` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,

    INDEX `VaiTro_Quyen_permission_id_idx`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `TaiKhoan` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `login` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NULL,
    `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    `failed_attempt_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `failed_window_started_at` DATETIME(3) NULL,
    `locked_until` DATETIME(3) NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TaiKhoan_code_key`(`code`),
    UNIQUE INDEX `TaiKhoan_login_key`(`login`),
    INDEX `TaiKhoan_role_id_idx`(`role_id`),
    INDEX `TaiKhoan_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `PhienDangNhap` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `csrf_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NOT NULL,
    `idle_expires_at` DATETIME(3) NOT NULL,
    `absolute_expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `PhienDangNhap_token_hash_key`(`token_hash`),
    INDEX `PhienDangNhap_account_id_idle_expires_at_absolute_expires_at_idx`(`account_id`, `idle_expires_at`, `absolute_expires_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `actor_id` BIGINT UNSIGNED NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_type` VARCHAR(100) NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `correlation_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_target_type_target_id_created_at_idx`(`target_type`, `target_id`, `created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `IdempotencyRequest` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT UNSIGNED NOT NULL,
    `operation` VARCHAR(100) NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `response` JSON NULL,
    `response_code` SMALLINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IdempotencyRequest_account_id_operation_key_key`(`account_id`, `operation`, `key`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- AddForeignKey
ALTER TABLE `VaiTro_Quyen` ADD CONSTRAINT `VaiTro_Quyen_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `VaiTroQuyen`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VaiTro_Quyen` ADD CONSTRAINT `VaiTro_Quyen_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Quyen`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TaiKhoan` ADD CONSTRAINT `TaiKhoan_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `VaiTroQuyen`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TaiKhoan` ADD CONSTRAINT `TaiKhoan_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `KhachHang`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `PhienDangNhap` ADD CONSTRAINT `PhienDangNhap_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `TaiKhoan`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `TaiKhoan`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `IdempotencyRequest` ADD CONSTRAINT `IdempotencyRequest_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `TaiKhoan`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Reviewed native constraints: approved NT04/NT09; customer_id intentionally NOT UNIQUE.
ALTER TABLE `KhachHang` MODIFY `code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `VaiTroQuyen` MODIFY `code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `Quyen` MODIFY `code` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `TaiKhoan` MODIFY `code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `TaiKhoan` MODIFY `login` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `PhienDangNhap` MODIFY `token_hash` CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `PhienDangNhap` MODIFY `csrf_hash` CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `IdempotencyRequest` MODIFY `operation` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `IdempotencyRequest` MODIFY `key` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `IdempotencyRequest` MODIFY `request_hash` CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL;
ALTER TABLE `TaiKhoan` ADD CONSTRAINT `TaiKhoan_login_normalized` CHECK (REGEXP_LIKE(`login`, '^[a-z0-9][a-z0-9_.-]{0,99}$', 'c'));
ALTER TABLE `PhienDangNhap` ADD CONSTRAINT `PhienDangNhap_expiry_bounds` CHECK (`created_at` < `idle_expires_at` AND `idle_expires_at` <= `absolute_expires_at` AND `last_seen_at` >= `created_at`);
ALTER TABLE `IdempotencyRequest` ADD CONSTRAINT `Idempotency_expiry_bounds` CHECK (`expires_at` > `created_at`);
