import { Router } from "express";
import { login, register, me } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;
