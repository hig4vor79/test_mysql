import pool from "../db.js";

const userDB = "testtable";

export const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${userDB}`); // SQL-запрос для выборки всех данных из таблицы testtable

    // Отправляем результаты запроса в формате JSON
    res.json(rows);
  } catch (err) {
    console.error("Request execution error: ", err);
    res.status(500).json({
      message: "Failed to get users",
      error: err.message,
    });
  }
};

//TODO
