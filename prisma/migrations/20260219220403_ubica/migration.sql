/*
  Warnings:

  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `business_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `categoria_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_fin` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `precio` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `events` table. All the data in the column will be lost.
  - The primary key for the `favorites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `business_id` on the `favorites` table. All the data in the column will be lost.
  - The primary key for the `reports` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `business_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `motivo` on the `reports` table. All the data in the column will be lost.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `nombre` on the `roles` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `correo` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `foto_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `business_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `businesses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `place_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `place_id` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_type` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `is_active` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `business_images` DROP FOREIGN KEY `business_images_ibfk_1`;

-- DropForeignKey
ALTER TABLE `businesses` DROP FOREIGN KEY `businesses_ibfk_1`;

-- DropForeignKey
ALTER TABLE `businesses` DROP FOREIGN KEY `businesses_ibfk_2`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_1`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_ibfk_2`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_ibfk_1`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_ibfk_2`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_ibfk_1`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_ibfk_2`;

-- DropForeignKey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_ibfk_1`;

-- DropForeignKey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_ibfk_2`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_ibfk_1`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_ibfk_2`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_ibfk_1`;

-- DropIndex
DROP INDEX `business_id` ON `events`;

-- DropIndex
DROP INDEX `categoria_id` ON `events`;

-- DropIndex
DROP INDEX `idx_events_date` ON `events`;

-- DropIndex
DROP INDEX `business_id` ON `favorites`;

-- DropIndex
DROP INDEX `business_id` ON `reports`;

-- DropIndex
DROP INDEX `user_id` ON `reports`;

-- DropIndex
DROP INDEX `nombre` ON `roles`;

-- DropIndex
DROP INDEX `correo` ON `users`;

-- DropIndex
DROP INDEX `role_id` ON `users`;

-- AlterTable
ALTER TABLE `events` DROP PRIMARY KEY,
    DROP COLUMN `business_id`,
    DROP COLUMN `categoria_id`,
    DROP COLUMN `descripcion`,
    DROP COLUMN `estado`,
    DROP COLUMN `fecha_fin`,
    DROP COLUMN `fecha_inicio`,
    DROP COLUMN `precio`,
    DROP COLUMN `titulo`,
    ADD COLUMN `category_id` VARCHAR(191) NULL,
    ADD COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'COP',
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `dress_code` VARCHAR(120) NULL,
    ADD COLUMN `end_time` TIME NULL,
    ADD COLUMN `min_age` INTEGER NULL,
    ADD COLUMN `place_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `price_from` DECIMAL(12, 2) NULL,
    ADD COLUMN `price_to` DECIMAL(12, 2) NULL,
    ADD COLUMN `start_time` TIME NOT NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'CANCELLED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `title` VARCHAR(200) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `favorites` DROP PRIMARY KEY,
    DROP COLUMN `business_id`,
    ADD COLUMN `place_id` VARCHAR(191) NOT NULL,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD PRIMARY KEY (`user_id`, `place_id`);

-- AlterTable
ALTER TABLE `reports` DROP PRIMARY KEY,
    DROP COLUMN `business_id`,
    DROP COLUMN `estado`,
    DROP COLUMN `motivo`,
    ADD COLUMN `details` VARCHAR(191) NULL,
    ADD COLUMN `event_id` VARCHAR(191) NULL,
    ADD COLUMN `place_id` VARCHAR(191) NULL,
    ADD COLUMN `reason` ENUM('WRONG_INFO', 'SPAM', 'INAPPROPRIATE', 'CLOSED', 'OTHER') NOT NULL,
    ADD COLUMN `resolved_at` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `target_type` ENUM('PLACE', 'EVENT') NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `user_id` VARCHAR(191) NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `roles` DROP PRIMARY KEY,
    DROP COLUMN `nombre`,
    ADD COLUMN `code` VARCHAR(50) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(100) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    DROP COLUMN `correo`,
    DROP COLUMN `foto_url`,
    DROP COLUMN `nombre`,
    DROP COLUMN `password`,
    DROP COLUMN `role_id`,
    DROP COLUMN `telefono`,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(254) NOT NULL,
    ADD COLUMN `full_name` VARCHAR(160) NULL,
    ADD COLUMN `password_hash` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(30) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `is_active` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `business_images`;

-- DropTable
DROP TABLE `businesses`;

-- DropTable
DROP TABLE `categories`;

-- DropTable
DROP TABLE `plans`;

-- DropTable
DROP TABLE `reviews`;

-- DropTable
DROP TABLE `subscriptions`;

-- CreateTable
CREATE TABLE `cities` (
    `id` VARCHAR(191) NOT NULL,
    `country_code` CHAR(2) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `state_region` VARCHAR(120) NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cities_country_code_name_state_region_key`(`country_code`, `name`, `state_region`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `place_types` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `place_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_categories` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `event_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `places` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `city_id` VARCHAR(191) NOT NULL,
    `place_type_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `description` VARCHAR(191) NULL,
    `address_line` VARCHAR(240) NULL,
    `neighborhood` VARCHAR(140) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `price_level` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `places_city_id_place_type_id_idx`(`city_id`, `place_type_id`),
    INDEX `places_status_idx`(`status`),
    INDEX `places_latitude_longitude_idx`(`latitude`, `longitude`),
    UNIQUE INDEX `places_city_id_slug_key`(`city_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `place_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `contact_type` ENUM('WHATSAPP', 'PHONE', 'EMAIL', 'WEBSITE') NOT NULL,
    `label` VARCHAR(80) NULL,
    `value` VARCHAR(240) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `place_contacts_place_id_idx`(`place_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `place_social_links` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `platform` ENUM('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'X', 'YOUTUBE', 'OTHER') NOT NULL,
    `url` VARCHAR(400) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `place_social_links_place_id_idx`(`place_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `place_photos` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(200) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `place_photos_place_id_idx`(`place_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opening_hours` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `open_time` TIME NULL,
    `close_time` TIME NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `opening_hours_place_id_weekday_key`(`place_id`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_recurrences` (
    `event_id` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_special_dates` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `event_date` DATE NOT NULL,
    `date_type` ENUM('OCCURRENCE', 'EXCEPTION') NOT NULL DEFAULT 'OCCURRENCE',
    `note` VARCHAR(250) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_special_dates_event_date_idx`(`event_date`),
    INDEX `event_special_dates_event_id_idx`(`event_id`),
    UNIQUE INDEX `event_special_dates_event_id_event_date_date_type_key`(`event_id`, `event_date`, `date_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_events` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `event_type` ENUM('PLACE_VIEW', 'EVENT_VIEW', 'CONTACT_CLICK', 'FAVORITE_ADD', 'FAVORITE_REMOVE', 'REPORT_CREATE') NOT NULL,
    `place_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `analytics_events_occurred_at_idx`(`occurred_at`),
    INDEX `analytics_events_place_id_idx`(`place_id`),
    INDEX `analytics_events_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `entity_type` VARCHAR(30) NOT NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `events_place_id_idx` ON `events`(`place_id`);

-- CreateIndex
CREATE INDEX `events_category_id_idx` ON `events`(`category_id`);

-- CreateIndex
CREATE INDEX `events_status_idx` ON `events`(`status`);

-- CreateIndex
CREATE INDEX `reports_status_idx` ON `reports`(`status`);

-- CreateIndex
CREATE INDEX `reports_place_id_idx` ON `reports`(`place_id`);

-- CreateIndex
CREATE INDEX `reports_event_id_idx` ON `reports`(`event_id`);

-- CreateIndex
CREATE UNIQUE INDEX `roles_code_key` ON `roles`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_place_type_id_fkey` FOREIGN KEY (`place_type_id`) REFERENCES `place_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `place_contacts` ADD CONSTRAINT `place_contacts_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `place_social_links` ADD CONSTRAINT `place_social_links_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `place_photos` ADD CONSTRAINT `place_photos_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opening_hours` ADD CONSTRAINT `opening_hours_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `event_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_recurrences` ADD CONSTRAINT `event_recurrences_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_special_dates` ADD CONSTRAINT `event_special_dates_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
