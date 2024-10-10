import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); // Подключаем переменные окружения

// Создаем пул соединений с базой данных
const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export default pool;
