import { Router } from "express";
import { create, list } from "./comment.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/", list);
router.post("/", authMiddleware, create);

export default router;
