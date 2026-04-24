import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: "localhost",
  port: 3307,
  user: "root",
  password: "",
  database: "ubica2_pro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función helper para ejecutar queries
export const query = async (sql: string, params?: any[]) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export default pool;