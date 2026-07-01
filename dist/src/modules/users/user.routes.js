"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const role_middleware_1 = require("../../shared/middlewares/role.middleware");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
router.get("/profile", auth_middleware_1.authMiddleware, user_controller_1.me);
router.put("/profile", auth_middleware_1.authMiddleware, user_controller_1.updateMe);
// HU-22: Gestión de roles y usuarios (solo ADMIN)
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("ADMIN"), user_controller_1.getAllUsers);
router.put("/:id/role", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("ADMIN"), user_controller_1.updateRole);
exports.default = router;
