"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Health check for this subrouter
router.get("/ping", (_req, res) => {
    res.json({ ok: true, routes: ["POST /promote"] });
});
router.post("/promote", auth_middleware_1.authMiddleware, payments_controller_1.promoteTarget);
exports.default = router;
