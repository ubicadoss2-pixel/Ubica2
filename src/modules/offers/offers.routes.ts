import { Router } from "express";
import {
  create,
  update,
  remove,
  listByPlace,
  listActive,
  listByOwner,
} from "./offers.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";

const router = Router();

// Public routes
router.get("/", listActive);
router.get("/place/:placeId", listByPlace);

// Owner routes
router.get("/owner/me", authMiddleware, authorize("OWNER", "ADMIN"), listByOwner);

// Protected routes (owner only - authorized in controller)
router.post("/", authMiddleware, create);
router.patch("/:id", authMiddleware, update);
router.delete("/:id", authMiddleware, remove);

export default router;
