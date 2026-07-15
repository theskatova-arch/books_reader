import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import booksRouter from "./books.js";
import feedRouter from "./feed.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/books", booksRouter);
router.use("/feed", feedRouter);

export default router;
