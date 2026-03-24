import { Router } from "express";
import {
  createSearchEntry,
  getHistory,
  clearHistory,
  deleteHistoryItem,
} from "./search-history.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createSearchEntry);
router.get("/", getHistory);
router.delete("/", clearHistory);
router.delete("/:id", deleteHistoryItem);

export default router;
