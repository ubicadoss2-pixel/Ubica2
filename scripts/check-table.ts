import mysql from "mysql2/promise";

async function checkTable() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "root",
    database: "ubica2_pro"
  });

  const [rows] = await connection.execute("DESCRIBE user_preferences");
  console.log("Estructura de user_preferences:", JSON.stringify(rows, null, 2));
  
  await connection.end();
}

checkTable();