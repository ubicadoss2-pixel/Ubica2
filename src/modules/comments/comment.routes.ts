import { Router } from "express";
import { create, list, update, remove, like } from "./comment.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/", list);
router.post("/", authMiddleware, create);
router.put("/:id", authMiddleware, update);
router.delete("/:id", authMiddleware, remove);
router.post("/:id/like", authMiddleware, like);

export default router;
