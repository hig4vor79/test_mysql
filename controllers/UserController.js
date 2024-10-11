import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import pool from "../db.js";

dotenv.config();
const userDB = "users";

export const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${userDB}`); // SQL-запрос для выборки всех данных из таблицы users

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

export const register = async (req, res) => {
  let { name, email, password } = req.body;

  // Проверка на обязательные поля email и password
  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }

  // Если имя не указано, используем часть email до "@"
  if (!name) {
    name = email.split("@")[0];
  }

  try {
    // Проверка на существование пользователя с таким же email
    const selectQueryByEmail = "SELECT * FROM users WHERE email = ?";
    const [selectQueryByEmailResult] = await pool.query(selectQueryByEmail, [
      email,
    ]);

    if (selectQueryByEmailResult.length > 0) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    // Генерация хэша пароля
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Вставка нового пользователя в базу данных
    const insertQuery =
      "INSERT INTO users (name, email, passwordHash) VALUES (?, ?, ?)";
    const [insertResult] = await pool.query(insertQuery, [name, email, hash]);
    const userId = insertResult.insertId;

    // Запрос данных нового пользователя
    const selectQuery = "SELECT * FROM users WHERE id = ?";
    const [userResult] = await pool.query(selectQuery, [userId]);

    // Создание JWT токена
    const token = jwt.sign({ _id: userId }, process.env.JWT_HASH, {
      expiresIn: "30d",
    });

    // Возвращаем данные нового пользователя и токен
    res.status(201).json({
      user: userResult[0],
      token,
    });
  } catch (err) {
    console.error("Ошибка при регистрации: " + err.stack);
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
};

export const login = async (req, res) => {
  let { email, password } = req.body;

  // Проверка на обязательные поля email и password
  if (!email || !password) {
    return res.status(400).json({ message: "Email и пароль обязательны" });
  }

  try {
    // Проверка на существование пользователя с таким же email
    const selectQueryByEmail = "SELECT * FROM users WHERE email = ?";
    const [selectQueryByEmailResult] = await pool.query(selectQueryByEmail, [
      email,
    ]);

    if (selectQueryByEmailResult.length == 0) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email не существует" });
    }

    const isValidPass = await bcrypt.compare(
      password,
      selectQueryByEmailResult[0].passwordHash
    );

    if (!isValidPass) {
      return res.status(400).json({
        message: "Неверный логин или пароль",
      });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { _id: selectQueryByEmailResult[0].id },
      process.env.JWT_HASH,
      {
        expiresIn: "30d",
      }
    );

    // Возвращаем данные нового пользователя и токен
    res.status(201).json({
      user: selectQueryByEmailResult[0],
      token,
    });
  } catch (err) {
    console.error("Ошибка авторизации: " + err.stack);
    res.status(500).json({ message: "Ошибка авторизации", error: err.message });
  }
};

export const remove = async (req, res) => {
  const { id } = req.params; // Получаем id пользователя из параметров запроса

  // Проверяем, что id передан
  if (!id) {
    return res.status(400).json({ message: "Необходимо передать id" });
  }

  try {
    // Сначала проверяем наличие пользователя
    const [userResults] = await pool.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    // Если пользователь не найден, возвращаем статус 404
    if (userResults.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Выполняем запрос на удаление пользователя
    const [deleteResults] = await pool.query("DELETE FROM users WHERE id = ?", [
      id,
    ]);

    // Проверяем, был ли удален пользователь
    if (deleteResults.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Не удалось удалить пользователя" });
    }

    res.status(200).json({ message: "Пользователь удален", userId: id });
  } catch (err) {
    console.error("Ошибка выполнения запроса: " + err.stack);
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
};

//TODO
export const update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // Данные, которые приходят с клиента

  // Проверяем, что необходимое поле передано
  if (!name || !id) {
    return res.status(400).json({ message: "Mast be a name and an id." });
  }

  try {
    // Сначала проверяем наличие пользователя
    const [userResults] = await pool.query(
      `SELECT * FROM ${userDB} WHERE id = ?`,
      [id]
    );

    // Если пользователь не найден, возвращаем статус 404
    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // Выполняем запрос на обновление данных пользователя
    const [updateResults] = await pool.query(
      `UPDATE users SET name = ? WHERE id = ?`,
      [name, id]
    );

    if (updateResults.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Не удалось обновить пользователя." });
    }

    res.status(200).json({ message: "Пользователь обновлен", userId: id });
  } catch (error) {
    console.error("Ошибка выполнения запроса: " + err.stack);
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
};

export const getUser = async (req, res) => {
  const { id } = req.params;

  // Проверяем, что необходимое поле передано
  if (!id) {
    return res.status(400).json({ message: "Mast be an id." });
  }

  try {
    // Сначала проверяем наличие пользователя
    const [userResults] = await pool.query(
      `SELECT * FROM ${userDB} WHERE id = ?`,
      [id]
    );

    // Если пользователь не найден, возвращаем статус 404
    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Пользователь найден", user: userResults });
  } catch (error) {
    console.error("Ошибка выполнения запроса: " + err.stack);
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
};

//TODO
export const resetPass = async (req, res) => {};
