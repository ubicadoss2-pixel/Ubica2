import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { me, updateMe, updateRole, getAllUsers } from "./user.controller";

const router = Router();

router.get("/profile", authMiddleware, me);
router.put("/profile", authMiddleware, updateMe);

// HU-22: Gestión de roles y usuarios (solo ADMIN)
router.get("/", authMiddleware, authorize("ADMIN"), getAllUsers);
router.put("/:id/role", authMiddleware, authorize("ADMIN"), updateRole);

export default router;
