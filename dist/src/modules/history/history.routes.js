"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const history_controller_1 = require("./history.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rutas de historial
router.get("/", auth_middleware_1.authMiddleware, history_controller_1.getHistory);
router.post("/", auth_middleware_1.authMiddleware, history_controller_1.addHistory);
router.delete("/", auth_middleware_1.authMiddleware, history_controller_1.clearHistory);
exports.default = router;
