-- Seed SQL para usuarios, roles, ciudades, tipos de lugar y lugares principales
-- Contraseña común: 12345678

SET @@SESSION.sql_mode = 'NO_ENGINE_SUBSTITUTION';

-- Roles
INSERT INTO roles (id, code, name, created_at)
VALUES
  ('20e4dff2-403c-4f77-9c2a-0cd18df4adce', 'ADMIN', 'Administrador', NOW()),
  ('5347d872-bf2b-4d7d-9202-8bc49d0f9f06', 'OWNER', 'Propietario', NOW()),
  ('e2ee85e3-5ef0-42d9-bd19-0f7bbfd39d72', 'USER', 'Usuario', NOW())
ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name);

-- Usuarios
INSERT INTO users (id, email, full_name, password_hash, is_active, created_at, updated_at)
VALUES
  ('ce417f18-2f83-4fda-a177-7f3f7f6fa926', 'admin@ubica2.com', 'Admin Ubica2', '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', TRUE, NOW(), NOW()),
  ('7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'owner@ubica2.com', 'Laura Propietaria', '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', TRUE, NOW(), NOW()),
  ('d9f0a4f8-3bc4-4b9f-99c7-2a47cedf4b34', 'user@ubica2.com', 'Visitante Demo', '$2b$10$Q917tgxTXnTug8m3PZGVCO7oE3IN5ird8iqnb6ZU.lM97Z3Xl6O8S', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), updated_at = NOW();

-- Asignación de roles a usuarios
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES
  ('ce417f18-2f83-4fda-a177-7f3f7f6fa926', '20e4dff2-403c-4f77-9c2a-0cd18df4adce', NOW()),
  ('7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', '5347d872-bf2b-4d7d-9202-8bc49d0f9f06', NOW()),
  ('d9f0a4f8-3bc4-4b9f-99c7-2a47cedf4b34', 'e2ee85e3-5ef0-42d9-bd19-0f7bbfd39d72', NOW())
ON DUPLICATE KEY UPDATE created_at = VALUES(created_at);

-- Ciudades
INSERT INTO cities (id, country_code, name, state_region, timezone, created_at)
VALUES
  ('b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'CO', 'Armenia', 'Quindio', 'America/Bogota', NOW()),
  ('6a3a4060-dd06-4ff8-8f6f-36a5dd282079', 'CO', 'Medellin', 'Antioquia', 'America/Bogota', NOW()),
  ('2c9fe7d5-c83d-4e9f-9c54-8be78eb963d7', 'CO', 'Bogota', 'Cundinamarca', 'America/Bogota', NOW())
ON DUPLICATE KEY UPDATE state_region = VALUES(state_region), timezone = VALUES(timezone);

-- Tipos de lugar
INSERT INTO place_types (id, code, name, created_at)
VALUES
  ('fbf1af20-71ad-41c8-bb2d-8a98c975e0f5', 'BAR', 'Bar', NOW()),
  ('4099a4e5-1f56-4216-9f2b-0a3b8c9e7de7', 'CAFE', 'Café', NOW()),
  ('4329b332-b9a3-4f36-8935-2ae1bdcd48e4', 'CLUB', 'Discoteca', NOW()),
  ('d2c18b08-a8de-4b9c-8c4f-3b0ea81b97c6', 'RESTAURANT', 'Restaurante', NOW()),
  ('a381f424-9c6a-4db4-bf57-7fa2a1a6f590', 'PARK', 'Parque', NOW()),
  ('59608df8-ce4f-402a-8c74-4bcb7d399f4b', 'MUSEUM', 'Museo', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Categorías de eventos (opcional)
INSERT INTO event_categories (id, code, name, created_at)
VALUES
  ('cf6d8fff-a6ca-405d-a559-2a12f7aa6a90', 'SALSA', 'Salsa', NOW()),
  ('05cb40ee-1b4e-4e3a-8a76-16d899f41602', 'TECHNO', 'Techno', NOW()),
  ('292f7ca0-79a2-4b06-8d24-ebd55f5a08fe', 'REGGAETON', 'Reggaetón', NOW()),
  ('2b5001d0-1e67-42a6-ac7b-6d497a94800c', 'ROCK', 'Rock', NOW()),
  ('c8a19d93-7680-4f03-be41-b3fd1eef4dce', 'GASTRO', 'Gastronómico', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Lugares principales en Armenia
INSERT INTO places (id, owner_user_id, city_id, place_type_id, name, slug, description, address_line, neighborhood, latitude, longitude, price_level, status, created_at, updated_at)
VALUES
  ('c7c36880-0c0c-4fde-ab35-42cb67d9b947', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'd2c18b08-a8de-4b9c-8c4f-3b0ea81b97c6', 'La Fogata', 'la-fogata', 'El restaurante de mayor tradición en el Quindío. Especialistas en carnes maduradas y cocina internacional en un ambiente elegante.', 'Avenida Bolívar No. 14N-11', 'Norte', 4.5512, -75.6605, 4, 'PUBLISHED', NOW(), NOW()),
  ('516ec5cc-2f50-4d6e-9a48-54e2cbab5c0d', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', '4329b332-b9a3-4f36-8935-2ae1bdcd48e4', 'Dar Papaya', 'dar-papaya', 'El sitio de rumba cruzada más emblemático de Armenia. Música en vivo, cócteles neón y la mejor energía de la ciudad.', 'Avenida Bolívar Calle 19 Norte', 'Norte', 4.5620, -75.6560, 3, 'PUBLISHED', NOW(), NOW()),
  ('2c9a0fdd-7d08-438d-a49a-5da57f8ea0c8', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'd2c18b08-a8de-4b9c-8c4f-3b0ea81b97c6', 'El Solar Gastrobar', 'el-solar-gastrobar', 'Una mezcla perfecta entre gastronomía de autor y coctelería creativa. Un espacio abierto con diseño moderno y vegetación.', 'Carrera 14 # 21 Norte', 'Norte', 4.5650, -75.6540, 3, 'PUBLISHED', NOW(), NOW()),
  ('4f2201e1-28a4-4db4-9f3a-1959f106c19a', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', '4329b332-b9a3-4f36-8935-2ae1bdcd48e4', 'El Bunker', 'el-bunker', 'Espeakeasy clandestino con los mejores gin-tonics de la región. Música house y techno suave en un ambiente industrial.', 'Sector Oro Negro', 'Norte', 4.5680, -75.6510, 4, 'PUBLISHED', NOW(), NOW()),
  ('97e8b77c-97f8-4d34-ad14-bb12ef9a7f38', 'ce417f18-2f83-4fda-a177-7f3f7f6fa926', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', '59608df8-ce4f-402a-8c74-4bcb7d399f4b', 'Museo del Oro Quimbaya', 'museo-del-oro-quimbaya', 'Obra maestra del arquitecto Rogelio Salmona. Alberga la colección arqueológica más importante del Eje Cafetero.', 'Avenida Bolívar Calle 26 Norte', 'Norte', 4.5615, -75.6565, 1, 'PUBLISHED', NOW(), NOW()),
  ('1f2c3a44-72a2-4920-9d2f-5ba75df9fd90', 'ce417f18-2f83-4fda-a177-7f3f7f6fa926', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'a381f424-9c6a-4db4-bf57-7fa2a1a6f590', 'Parque de la Vida', 'parque-de-la-vida', 'El pulmón verde de Armenia. Senderos, lagos y una exuberante vegetación en pleno centro norte.', 'Avenida Bolívar con Calle 10 Norte', 'Norte', 4.5492, -75.6615, 1, 'PUBLISHED', NOW(), NOW()),
  ('6a5b9d7e-3be2-4d0d-9c1e-37f845115e66', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', '4099a4e5-1f56-4216-9f2b-0a3b8c9e7de7', 'Café Quindío Gourmet', 'cafe-quindio-parque-sucre', 'La mejor experiencia de café en el corazón de Armenia. Degusta los mejores varietales frente al icónico Parque Sucre.', 'Carrera 14 # 12-11 (Parque Sucre)', 'Centro', 4.5385, -75.6662, 2, 'PUBLISHED', NOW(), NOW()),
  ('7d0c481f-4b4d-4f00-a4ed-d1a18039d315', 'ce417f18-2f83-4fda-a177-7f3f7f6fa926', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'd2c18b08-a8de-4b9c-8c4f-3b0ea81b97c6', 'Centro Comercial Portal del Quindío', 'portal-del-quindio', 'El centro comercial preferido del norte de Armenia. Cine, compras y una excelente plaza de comidas.', 'Avenida Bolívar No. 19 Norte-46', 'Norte', 4.5580, -75.6585, 3, 'PUBLISHED', NOW(), NOW()),
  ('3c2e7d3b-6f5e-4107-9827-9879d4f627e0', '7a324fe5-82f7-4cdc-8b14-58d4fbd5e2f2', 'b0f9f50a-9d17-4db6-bc05-7ed305121c43', 'd2c18b08-a8de-4b9c-8c4f-3b0ea81b97c6', 'Restaurante El Roble', 'restaurante-el-roble', 'Parada obligatoria para probar el mejor chicharrón y platos típicos del Quindío. Tradición en la vía.', 'Autopista del Café Km 10', 'Rural', 4.6050, -75.6200, 3, 'PUBLISHED', NOW(), NOW())
ON DUPLICATE KEY UPDATE description = VALUES(description), address_line = VALUES(address_line), neighborhood = VALUES(neighborhood), latitude = VALUES(latitude), longitude = VALUES(longitude), price_level = VALUES(price_level), status = VALUES(status), updated_at = NOW();

-- Fotos de lugares
INSERT INTO place_photos (id, place_id, url, alt_text, sort_order, created_at)
VALUES
  ('732a4afc-9c58-4a05-8ff1-f5ac8011fb5b', 'c7c36880-0c0c-4fde-ab35-42cb67d9b947', 'https://images.unsplash.com/photo-1550966842-2849a221082b?auto=format&fit=crop&w=800&q=80', 'La Fogata', 1, NOW()),
  ('1cfc6d91-96a8-44bc-855c-2a7a98b9d086', '516ec5cc-2f50-4d6e-9a48-54e2cbab5c0d', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', 'Dar Papaya', 1, NOW()),
  ('7d9c7b56-1201-4729-9a4e-2846db7c9d76', '2c9a0fdd-7d08-438d-a49a-5da57f8ea0c8', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 'El Solar Gastrobar', 1, NOW()),
  ('6eaf12f9-8b57-41f3-b3d7-3ed1c3d0ef16', '4f2201e1-28a4-4db4-9f3a-1959f106c19a', 'assets/elbunker.jpg', 'El Bunker', 1, NOW()),
  ('84d8d7f4-3e47-4d1d-9cea-e5f1aff2ca8a', '97e8b77c-97f8-4d34-ad14-bb12ef9a7f38', 'assets/museodeoro.jpg', 'Museo del Oro Quimbaya', 1, NOW()),
  ('c74f0d8b-f51f-4e4b-9db1-9b6366c38601', '1f2c3a44-72a2-4920-9d2f-5ba75df9fd90', 'assets/ParquedeLaVidaArmenia.jpeg', 'Parque de la Vida', 1, NOW()),
  ('1b5a8d7c-2374-4f52-82d5-160b1f2a9d90', '6a5b9d7e-3be2-4d0d-9c1e-37f845115e66', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 'Café Quindío Gourmet', 1, NOW()),
  ('2c0e872d-08f7-43c1-9b4d-7fe2cb03ea78', '7d0c481f-4b4d-4f00-a4ed-d1a18039d315', 'assets/portalquindio.jpg', 'Centro Comercial Portal del Quindío', 1, NOW()),
  ('79ea4e01-3b8f-4da6-81b1-5bc8b0c50a1e', '3c2e7d3b-6f5e-4107-9827-9879d4f627e0', 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=800&q=80', 'Restaurante El Roble', 1, NOW())
ON DUPLICATE KEY UPDATE url = VALUES(url), alt_text = VALUES(alt_text), sort_order = VALUES(sort_order);