import { Router } from "express";
import { authMiddleware, optionalAuth } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { create, list, update } from "./report.controller";

const router = Router();

router.post("/", optionalAuth, create);

router.get("/", authMiddleware, authorize("ADMIN"), list);
router.patch("/:id", authMiddleware, authorize("ADMIN"), update);

export default router;

