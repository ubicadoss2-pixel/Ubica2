import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { add, list, remove } from "./favorite.controller";

const router = Router();

router.get("/", authMiddleware, list);
router.post("/:placeId", authMiddleware, add);
router.delete("/:placeId", authMiddleware, remove);

export default router;

