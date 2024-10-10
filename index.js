import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { checkAuth, checkAdmin } from "./utils/index.js";
import pool from "./db.js";
import { UserController, PostController } from "./controllers/index.js";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

pool
  .getConnection()
  .then(() => {
    console.log("DB ok");
  })
  .catch((err) => {
    console.error("DB error: " + err.stack);
  });

/**
 *  * Users
 **/
app.post("/auth/register", UserController.register);
app.post("/auth/login", UserController.login);

app.get("/user", checkAuth, UserController.getAll);
app.get("/user/id=:id", UserController.getUser);
app.patch("/user/id=:id", UserController.update);
app.delete("/user/id=:id", UserController.remove);

/**
 *  * Posts
 **/
app.get("/post", PostController.getAll);

/**
 *  * Main
 **/
app.get("/", (req, res) => {
  res.json({ message: "Это стартовая страница нашего приложения" });
});

app.listen(process.env.PORT || 3000, process.env.HOST, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log(`Server OK: http://` + process.env.HOST + ":" + process.env.PORT);
});
