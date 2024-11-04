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

    // Check for required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Automatically generate slug if not provided
    if (!slug) {
      slug = title.toLowerCase().replace(/\s+/g, "-"); // Simple slug generation
    }

    const selectQueryBySlug = `SELECT * FROM posts WHERE slug = ?`;
    const [selectQueryBySlugResult] = await pool.query(selectQueryBySlug, [
      slug,
    ]);

    if (selectQueryBySlugResult.length > 0) {
      return res
        .status(400)
        .json({ message: "A post with this slug already exists" });
    }

    // Insert the new post into the database with the associated user ID
    const insertQuery = `INSERT INTO posts (title, content, slug, userId) VALUES (?, ?, ?, ?)`;
    const [insertResult] = await pool.query(insertQuery, [
      title,
      content,
      slug,
      userId,
    ]);
    const postId = insertResult.insertId;

    // Retrieve and return the newly created post data
    const selectQuery = `SELECT * FROM posts WHERE id = ?`;
    const [postResult] = await pool.query(selectQuery, [postId]);

    res.status(201).json({
      post: postResult[0],
    });
  } catch (err) {
    console.error("Request execution error: ", err);
    res.status(500).json({
      message: "Failed to create post",
      error: err.message,
    });
  }
};

export const getPost = async (req, res) => {
  try {
    let { slug } = req.params;

    // Check for required fields
    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    const selectQueryBySlug = `SELECT * FROM posts WHERE slug = ?`;
    const [selectQueryBySlugResult] = await pool.query(selectQueryBySlug, [
      slug,
    ]);

    if (selectQueryBySlugResult.length < 0) {
      return res
        .status(400)
        .json({ message: "A post with this slug is not exists" });
    }

    res.status(200).json({
      post: selectQueryBySlugResult[0],
    });
  } catch (err) {
    console.error("Request execution error: ", err);
    res.status(500).json({
      message: "Failed to get post",
      error: err.message,
    });
  }
};

export const remove = async (req, res) => {
  const { slug } = req.params; // Получаем id пользователя из параметров запроса

  // Проверяем, что id передан
  if (!slug) {
    return res.status(400).json({ message: "Slug is required" });
  }

  try {
    // Сначала проверяем наличие пользователя
    const [postResults] = await pool.query(
      `SELECT * FROM ${postDB} WHERE slug = ?`,
      [slug]
    );

    // Если пользователь не найден, возвращаем статус 404
    if (postResults.length === 0) {
      return res
        .status(404)
        .json({ message: "Post with this slug is not find" });
    }

    // Выполняем запрос на удаление пользователя
    const [deleteResults] = await pool.query(
      `DELETE FROM ${postDB} WHERE slug = ?`,
      [slug]
    );

    // Проверяем, был ли удален пользователь
    if (deleteResults.affectedRows === 0) {
      return res.status(404).json({ message: "Removed user error" });
    }

    res.status(200).json({ message: "User removed", slug: slug });
  } catch (err) {
    console.error("Request execution error: ", err);
    res.status(500).json({
      message: "Failed to remove post",
      error: err.message,
    });
  }
};

//TODOs
