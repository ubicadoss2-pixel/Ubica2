-- Full database SQL script for Ubica2
-- Includes schema and seeded sample data from Prisma seed scripts.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_plans`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `analytics_events`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `event_special_dates`;
DROP TABLE IF EXISTS `event_photos`;
DROP TABLE IF EXISTS `event_recurrences`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `opening_hours`;
DROP TABLE IF EXISTS `place_photos`;
DROP TABLE IF EXISTS `place_social_links`;
DROP TABLE IF EXISTS `place_contacts`;
DROP TABLE IF EXISTS `places`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `event_categories`;
DROP TABLE IF EXISTS `place_types`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `roles`;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(191) NULL,
    `full_name` VARCHAR(160) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
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
    `postal_code` VARCHAR(20) NULL,
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
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(191) NULL,
    `address_line` VARCHAR(240) NULL,
    `neighborhood` VARCHAR(140) NULL,
    `postal_code` VARCHAR(20) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `dress_code` VARCHAR(120) NULL,
    `min_age` INTEGER NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'COP',
    `price_from` DECIMAL(12, 2) NULL,
    `price_to` DECIMAL(12, 2) NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `events_place_id_idx`(`place_id`),
    INDEX `events_category_id_idx`(`category_id`),
    INDEX `events_status_idx`(`status`),
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
CREATE TABLE `event_photos` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(200) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_photos_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
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
CREATE TABLE `favorites` (
    `user_id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `place_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `target_type` ENUM('PLACE', 'EVENT') NOT NULL,
    `place_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `reason` ENUM('WRONG_INFO', 'SPAM', 'INAPPROPRIATE', 'CLOSED', 'OTHER') NOT NULL,
    `details` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `reports_status_idx`(`status`),
    INDEX `reports_place_id_idx`(`place_id`),
    INDEX `reports_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `place_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `content` VARCHAR(1000) NOT NULL,
    `rating` TINYINT NULL,
    `status` ENUM('VISIBLE', 'EDITED', 'HIDDEN', 'BLOCKED') NOT NULL DEFAULT 'VISIBLE',
    `moderated_by_id` VARCHAR(191) NULL,
    `moderated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `comments_status_idx`(`status`),
    INDEX `comments_user_id_idx`(`user_id`),
    INDEX `comments_place_id_idx`(`place_id`),
    INDEX `comments_event_id_idx`(`event_id`),
    INDEX `comments_moderated_by_id_idx`(`moderated_by_id`),
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

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `limit_places` INTEGER NOT NULL,
    `limit_events` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_plans` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_plans_user_id_idx`(`user_id`),
    INDEX `user_plans_plan_id_idx`(`plan_id`),
    INDEX `user_plans_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed data

INSERT INTO `roles` (`id`, `code`, `name`, `created_at`) VALUES
('r-admin', 'ADMIN', 'Administrador', '2026-06-22 00:00:00'),
('r-owner', 'OWNER', 'Propietario', '2026-06-22 00:00:00'),
('r-user', 'USER', 'Usuario', '2026-06-22 00:00:00');

INSERT INTO `cities` (`id`, `country_code`, `name`, `state_region`, `timezone`, `created_at`) VALUES
('c-armenia', 'CO', 'Armenia', 'Quindio', 'America/Bogota', '2026-06-22 00:00:00'),
('c-medellin', 'CO', 'Medellin', 'Antioquia', 'America/Bogota', '2026-06-22 00:00:00'),
('c-bogota', 'CO', 'Bogota', 'Cundinamarca', 'America/Bogota', '2026-06-22 00:00:00');

INSERT INTO `place_types` (`id`, `code`, `name`, `created_at`) VALUES
('pt-bar', 'BAR', 'Bar', '2026-06-22 00:00:00'),
('pt-cafe', 'CAFE', 'Café', '2026-06-22 00:00:00'),
('pt-club', 'CLUB', 'Discoteca', '2026-06-22 00:00:00'),
('pt-restaurant', 'RESTAURANT', 'Restaurante', '2026-06-22 00:00:00'),
('pt-park', 'PARK', 'Parque', '2026-06-22 00:00:00'),
('pt-museum', 'MUSEUM', 'Museo', '2026-06-22 00:00:00');

INSERT INTO `event_categories` (`id`, `code`, `name`, `created_at`) VALUES
('ec-salsa', 'SALSA', 'Salsa', '2026-06-22 00:00:00'),
('ec-techno', 'TECHNO', 'Techno', '2026-06-22 00:00:00'),
('ec-reggaeton', 'REGGAETON', 'Reggaetón', '2026-06-22 00:00:00'),
('ec-rock', 'ROCK', 'Rock', '2026-06-22 00:00:00'),
('ec-gastro', 'GASTRO', 'Gastronómico', '2026-06-22 00:00:00');

INSERT INTO `users` (`id`, `email`, `phone`, `password_hash`, `full_name`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES
('u-admin', 'admin@ubica2.com', NULL, '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', 'Admin Ubica2', NULL, true, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('u-owner', 'owner@ubica2.com', NULL, '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', 'Laura Propietaria', NULL, true, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('u-user', 'user@ubica2.com', NULL, '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', 'Visitante Demo', NULL, true, '2026-06-22 00:00:00', '2026-06-22 00:00:00');

INSERT INTO `user_roles` (`user_id`, `role_id`, `created_at`) VALUES
('u-admin', 'r-admin', '2026-06-22 00:00:00'),
('u-owner', 'r-owner', '2026-06-22 00:00:00'),
('u-user', 'r-user', '2026-06-22 00:00:00');

INSERT INTO `places` (`id`, `owner_user_id`, `city_id`, `place_type_id`, `name`, `slug`, `description`, `address_line`, `neighborhood`, `latitude`, `longitude`, `price_level`, `status`, `created_at`, `updated_at`) VALUES
('p-la-fogata', 'u-owner', 'c-armenia', 'pt-restaurant', 'La Fogata', 'la-fogata', 'El restaurante de mayor tradición en el Quindío. Especialistas en carnes maduradas y cocina internacional en un ambiente elegante.', 'Avenida Bolívar No. 14N-11', 'Norte', 4.551200, -75.660500, 4, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-dar-papaya', 'u-owner', 'c-armenia', 'pt-bar', 'Dar Papaya', 'dar-papaya', 'El sitio de rumba cruzada más emblemático de Armenia. Música en vivo, cócteles neón y la mejor energía de la ciudad.', 'Avenida Bolívar Calle 19 Norte', 'Norte', 4.562000, -75.656000, 3, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-el-solar-gastrobar', 'u-owner', 'c-armenia', 'pt-restaurant', 'El Solar Gastrobar', 'el-solar-gastrobar', 'Una mezcla perfecta entre gastronomía de autor y coctelería creativa. Un espacio abierto con diseño moderno y vegetación.', 'Carrera 14 # 21 Norte', 'Norte', 4.565000, -75.654000, 3, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-el-bunker', 'u-owner', 'c-armenia', 'pt-bar', 'El Bunker', 'el-bunker', 'Espeakeasy clandestino con los mejores gin-tonics de la región. Música house y techno suave en un ambiente industrial.', 'Sector Oro Negro', 'Norte', 4.568000, -75.651000, 4, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-museo-oro-quimbaya', 'u-admin', 'c-armenia', 'pt-museum', 'Museo del Oro Quimbaya', 'museo-del-oro-quimbaya', 'Obra maestra del arquitecto Rogelio Salmona. Alberga la colección arqueológica más importante del Eje Cafetero.', 'Avenida Bolívar Calle 26 Norte', 'Norte', 4.561500, -75.656500, 1, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-parque-de-la-vida', 'u-admin', 'c-armenia', 'pt-park', 'Parque de la Vida', 'parque-de-la-vida', 'El pulmón verde de Armenia. Senderos, lagos y una exuberante vegetación en pleno centro norte.', 'Avenida Bolívar con Calle 10 Norte', 'Norte', 4.549200, -75.661500, 1, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-cafe-quindio-parque-sucre', 'u-owner', 'c-armenia', 'pt-cafe', 'Café Quindío Gourmet', 'cafe-quindio-parque-sucre', 'La mejor experiencia de café en el corazón de Armenia. Degusta los mejores varietales frente al icónico Parque Sucre.', 'Carrera 14 # 12-11 (Parque Sucre)', 'Centro', 4.538500, -75.666200, 2, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-portal-del-quindio', 'u-admin', 'c-armenia', 'pt-restaurant', 'Centro Comercial Portal del Quindío', 'portal-del-quindio', 'El centro comercial preferido del norte de Armenia. Cine, compras y una excelente plaza de comidas.', 'Avenida Bolívar No. 19 Norte-46', 'Norte', 4.558000, -75.658500, 3, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-restaurante-el-roble', 'u-owner', 'c-armenia', 'pt-restaurant', 'Restaurante El Roble', 'restaurante-el-roble', 'Parada obligatoria para probar el mejor chicharrón y platos típicos del Quindío. Tradición en la vía.', 'Autopista del Café Km 10', 'Rural', 4.605000, -75.620000, 3, 'PUBLISHED', '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('p-nuevo-negocio-pendiente', 'u-owner', 'c-armenia', 'pt-restaurant', 'Nuevo Negocio Pendiente', 'nuevo-negocio-pendiente', 'Nuevo negocio pendiente de revisión.', NULL, NULL, 4.500000, -75.600000, NULL, 'DRAFT', '2026-06-22 00:00:00', '2026-06-22 00:00:00');

INSERT INTO `place_photos` (`id`, `place_id`, `url`, `sort_order`, `created_at`) VALUES
('ph-la-fogata-1', 'p-la-fogata', 'https://images.unsplash.com/photo-1550966842-2849a221082b?auto=format&fit=crop&w=800&q=80', 1, '2026-06-22 00:00:00'),
('ph-dar-papaya-1', 'p-dar-papaya', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', 1, '2026-06-22 00:00:00'),
('ph-el-solar-1', 'p-el-solar-gastrobar', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 1, '2026-06-22 00:00:00'),
('ph-el-bunker-1', 'p-el-bunker', 'assets/elbunker.jpg', 1, '2026-06-22 00:00:00'),
('ph-museo-oro-1', 'p-museo-oro-quimbaya', 'assets/museodeoro.jpg', 1, '2026-06-22 00:00:00'),
('ph-parque-vida-1', 'p-parque-de-la-vida', 'assets/ParquedeLaVidaArmenia.jpeg', 1, '2026-06-22 00:00:00'),
('ph-cafe-quindio-1', 'p-cafe-quindio-parque-sucre', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 1, '2026-06-22 00:00:00'),
('ph-portal-quindio-1', 'p-portal-del-quindio', 'assets/portalquindio.jpg', 1, '2026-06-22 00:00:00'),
('ph-el-roble-1', 'p-restaurante-el-roble', 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=800&q=80', 1, '2026-06-22 00:00:00');

INSERT INTO `events` (`id`, `place_id`, `category_id`, `title`, `description`, `start_time`, `end_time`, `status`, `currency`, `price_from`, `created_at`, `updated_at`) VALUES
('e-papaya-viernes', 'p-dar-papaya', 'ec-salsa', 'Viernes de Orquesta Viva', 'La mejor orquesta de salsa de la región en vivo. ¡Clases de baile gratis de 8 PM a 9 PM!', '20:00:00', '03:00:00', 'ACTIVE', 'COP', 25000.00, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('e-bunker-underground', 'p-el-bunker', 'ec-techno', 'Underground Sessions', 'DJ Invitado nacional. Una noche cargada de Progressive House y Techno melódico.', '22:00:00', '04:00:00', 'ACTIVE', 'COP', 40000.00, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('e-solar-cata-vinos', 'p-el-solar-gastrobar', 'ec-gastro', 'Cata de Vinos y Tapas', 'Explora los sabores del viejo mundo guiado por nuestro Sommelier invitado. Incluye 4 copas y maridaje.', '19:00:00', '22:00:00', 'ACTIVE', 'COP', 85000.00, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('e-pendiente-1', 'p-la-fogata', 'ec-salsa', 'Evento Pendiente 1', NULL, CURTIME(), CURTIME(), 'ACTIVE', 'COP', NULL, '2026-06-22 00:00:00', '2026-06-22 00:00:00'),
('e-pendiente-2', 'p-la-fogata', 'ec-salsa', 'Evento Pendiente 2', NULL, CURTIME(), CURTIME(), 'ACTIVE', 'COP', NULL, '2026-06-22 00:00:00', '2026-06-22 00:00:00');

INSERT INTO `event_recurrences` (`event_id`, `weekday`, `created_at`) VALUES
('e-papaya-viernes', 5, '2026-06-22 00:00:00'),
('e-bunker-underground', 6, '2026-06-22 00:00:00'),
('e-solar-cata-vinos', 4, '2026-06-22 00:00:00');

INSERT INTO `event_photos` (`id`, `event_id`, `url`, `created_at`) VALUES
('ep-papaya-1', 'e-papaya-viernes', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', '2026-06-22 00:00:00'),
('ep-bunker-1', 'e-bunker-underground', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', '2026-06-22 00:00:00'),
('ep-solar-1', 'e-solar-cata-vinos', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', '2026-06-22 00:00:00');

INSERT INTO `plans` (`id`, `name`, `limit_places`, `limit_events`, `price`, `duration_days`, `is_active`, `created_at`) VALUES
('plan-basico', 'Básico', 3, 5, 29900.00, 30, true, '2026-06-22 00:00:00'),
('plan-profesional', 'Profesional', 10, 30, 79900.00, 30, true, '2026-06-22 00:00:00'),
('plan-premium', 'Premium', 999, 999, 149900.00, 30, true, '2026-06-22 00:00:00');

INSERT INTO `comments` (`id`, `user_id`, `place_id`, `content`, `rating`, `status`, `created_at`, `updated_at`) VALUES
('comment-pending-1', 'u-owner', 'p-la-fogata', 'Esta reseña es muy buena pero necesita moderación', 5, 'VISIBLE', '2026-06-22 00:00:00', '2026-06-22 00:00:00');

-- Foreign keys
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `places` ADD CONSTRAINT `places_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `places` ADD CONSTRAINT `places_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `places` ADD CONSTRAINT `places_place_type_id_fkey` FOREIGN KEY (`place_type_id`) REFERENCES `place_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `place_contacts` ADD CONSTRAINT `place_contacts_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `place_social_links` ADD CONSTRAINT `place_social_links_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `place_photos` ADD CONSTRAINT `place_photos_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `opening_hours` ADD CONSTRAINT `opening_hours_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `event_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `event_recurrences` ADD CONSTRAINT `event_recurrences_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_photos` ADD CONSTRAINT `event_photos_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_special_dates` ADD CONSTRAINT `event_special_dates_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `comments` ADD CONSTRAINT `comments_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `comments` ADD CONSTRAINT `comments_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `comments` ADD CONSTRAINT `comments_moderated_by_id_fkey` FOREIGN KEY (`moderated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `user_plans` ADD CONSTRAINT `user_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_plans` ADD CONSTRAINT `user_plans_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
