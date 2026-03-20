import { Router } from "express";
import { getPlans, getMyPlan, subscribe, checkout } from "./plan.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/", getPlans);
router.get("/my-plan", authMiddleware, getMyPlan);
router.post("/subscribe", authMiddleware, subscribe);
router.post("/checkout", authMiddleware, checkout);

export default router;
