import { Router } from "express";
import { login, register, me, forgotPwd, resetPwd, logoutUser } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, me);
router.post("/forgot-password", forgotPwd);
router.post("/reset-password", resetPwd);

export default router;
