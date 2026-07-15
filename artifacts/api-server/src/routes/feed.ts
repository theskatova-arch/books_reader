import { Router, type IRouter } from "express";
import { getAllUsersWithBooks } from "../lib/storage.js";

const router: IRouter = Router();

// GET /api/feed — public list of readers and their shelves
router.get("/", (_req, res) => {
  const entries = getAllUsersWithBooks();
  res.json(entries);
});

export default router;
