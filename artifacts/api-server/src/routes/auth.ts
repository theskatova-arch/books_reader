import { Router, type IRouter } from "express";
import crypto from "crypto";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import {
  findUserByUsername,
  createUser,
  type UserRecord,
} from "../lib/storage.js";

const router: IRouter = Router();

const MIN_PASSWORD = 3;
const MAX_PASSWORD = 6;

router.post("/register", (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || typeof username !== "string" || username.trim().length < 2) {
    res
      .status(400)
      .json({ error: "Имя пользователя должно содержать минимум 2 символа" });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Пароль обязателен" });
    return;
  }

  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    res.status(400).json({
      error: `Пароль должен содержать от ${MIN_PASSWORD} до ${MAX_PASSWORD} символов`,
    });
    return;
  }

  const existing = findUserByUsername(username.trim());
  if (existing) {
    res
      .status(409)
      .json({ error: "Пользователь с таким именем уже существует" });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const user: UserRecord = {
    id: crypto.randomUUID(),
    username: username.trim(),
    hash,
    salt,
  };
  createUser(user);

  const token = signToken(user.id, user.username);
  res.status(201).json({ token, username: user.username });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res
      .status(400)
      .json({ error: "Введите имя пользователя и пароль" });
    return;
  }

  const user = findUserByUsername(username.trim());
  if (!user || !verifyPassword(password, user.hash, user.salt)) {
    res
      .status(401)
      .json({ error: "Неверное имя пользователя или пароль" });
    return;
  }

  const token = signToken(user.id, user.username);
  res.json({ token, username: user.username });
});

export default router;
