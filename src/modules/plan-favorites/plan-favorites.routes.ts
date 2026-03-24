import { Router } from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "./plan-favorites.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getFavorites);
router.post("/:planId", addFavorite);
router.delete("/:planId", removeFavorite);
router.get("/:planId/check", checkFavorite);

export default router;
