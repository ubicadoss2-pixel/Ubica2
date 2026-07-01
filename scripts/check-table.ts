import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkTable() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL!
  );

  const [rows] = await connection.execute(
    "DESCRIBE user_preferences"
  );

  console.log(
    "Estructura de user_preferences:",
    JSON.stringify(rows, null, 2)
  );

  await connection.end();
}

checkTable();