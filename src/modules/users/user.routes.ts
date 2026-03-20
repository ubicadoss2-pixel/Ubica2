import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { me, updateMe } from "./user.controller";

const router = Router();

router.get("/profile", authMiddleware, me);
router.put("/profile", authMiddleware, updateMe);

export default router;
