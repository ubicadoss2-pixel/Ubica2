"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("./comment.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", comment_controller_1.list);
router.post("/", auth_middleware_1.authMiddleware, comment_controller_1.create);
exports.default = router;
