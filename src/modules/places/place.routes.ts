import { Router } from "express";
import { authMiddleware, optionalAuth } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { create, getById, list, update, updateStatus } from "./place.controller";

const router = Router();

router.get("/", optionalAuth, list);
router.get("/:id", getById);

router.post("/", authMiddleware, authorize("OWNER", "ADMIN"), create);
router.patch("/:id", authMiddleware, authorize("OWNER", "ADMIN"), update);
router.patch("/:id/status", authMiddleware, authorize("ADMIN"), updateStatus);

export default router;

