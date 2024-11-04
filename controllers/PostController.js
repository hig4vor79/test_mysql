import pool from "../db.js";

const postDB = "posts";

export const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${postDB}`); // SQL-запрос для выборки всех данных из таблицы testtable

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

export const create = async (req, res) => {
  try {
    let { title, content, userId, slug } = req.body;

    // Проверка на обязательные поля email и password
    if (!title) {
      return res.status(400).json({ message: "Название обязательно" });
    }

    if (!slug) {
      const generedSlug = title.toLowCase();
      slug = generedSlug;
    } else {
      // Проверка на существование поста с таким же email
      const selectQueryBySlug = `SELECT * FROM ${postDB} WHERE slug = ?`;
      const [selectQueryBySlugResult] = await pool.query(selectQueryBySlug, [
        email,
      ]);

      if (selectQueryBySlugResult.length > 0) {
        return res
          .status(400)
          .json({ message: "Пост с таким slug уже существует" });
      }
    }

    // Вставка нового пользователя в базу данных
    const insertQuery = `INSERT INTO ${postDB} (title, content, slug, userId) VALUES (?, ?, ?, ?)`;

    const [insertResult] = await pool.query(insertQuery, [
      title,
      content,
      slug,
      userId,
    ]);
    const postId = insertResult.insertId;

    // Запрос данных нового пользователя
    const selectQuery = `SELECT * FROM ${postDB} WHERE id = ?`;
    const [userResult] = await pool.query(selectQuery, [postId]);

    // Возвращаем данные нового пользователя и токен
    res.status(201).json({
      post: userResult[0],
    });
  } catch (err) {
    console.error("Request execution error: ", err);
    res.status(500).json({
      message: "Failed to create post",
      error: err.message,
    });
  }
};

//TODO
