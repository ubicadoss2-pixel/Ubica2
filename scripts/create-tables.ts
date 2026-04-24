import mysql from "mysql2/promise";

async function createTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "ubica2_pro"
  });

  const tables = [
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      preference_key VARCHAR(60) NOT NULL,
      preference_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_pref (user_id, preference_key),
      INDEX idx_user_preferences (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    
    `CREATE TABLE IF NOT EXISTS user_favorite_categories (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_category (user_id, category_id),
      INDEX idx_user_fav_categories (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    
    `CREATE TABLE IF NOT EXISTS user_history (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      item_id VARCHAR(36) NOT NULL,
      item_type ENUM('place', 'event') NOT NULL,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_history_user (user_id, viewed_at),
      INDEX idx_user_history_item (item_id, item_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  try {
    for (const sql of tables) {
      await connection.execute(sql);
      console.log("✅ Tabla creada");
    }
    console.log("✅ Todas las tablas creadas correctamente");
  } catch (error) {
    console.error("Error creando tablas:", error);
  } finally {
    await connection.end();
  }
}

createTables();