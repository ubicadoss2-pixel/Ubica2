import { Router } from "express";
import {
  create,
  update,
  remove,
  listByPlace,
  listActive,
  getByCode,
  redeem,
} from "./promotions.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/", listActive);
router.get("/code/:code", getByCode);
router.get("/place/:placeId", listByPlace);
router.post("/", authMiddleware, create);
router.patch("/:id", authMiddleware, update);
router.delete("/:id", authMiddleware, remove);
router.post("/redeem", authMiddleware, redeem);

export default router;
