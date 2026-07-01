import { Router } from "express";
import { getHistory, addHistory, clearHistory } from "./history.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

// Rutas de historial
router.get("/", authMiddleware, getHistory);
router.post("/", authMiddleware, addHistory);
router.delete("/", authMiddleware, clearHistory);

export default router;