import { Router } from "express";
import { authMiddleware, optionalAuth } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { create, summary } from "./analytics.controller";

const router = Router();

router.post("/", optionalAuth, create);
router.get("/summary", authMiddleware, authorize("ADMIN"), summary);

export default router;

