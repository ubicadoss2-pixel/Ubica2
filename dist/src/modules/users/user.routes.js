"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
router.get("/profile", auth_middleware_1.authMiddleware, user_controller_1.me);
router.put("/profile", auth_middleware_1.authMiddleware, user_controller_1.updateMe);
exports.default = router;
