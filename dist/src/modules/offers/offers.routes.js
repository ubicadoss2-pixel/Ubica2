"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const offers_controller_1 = require("./offers.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const role_middleware_1 = require("../../shared/middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", offers_controller_1.listActive);
router.get("/place/:placeId", offers_controller_1.listByPlace);
// Owner routes
router.get("/owner/me", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("OWNER", "ADMIN"), offers_controller_1.listByOwner);
// Protected routes (owner only - authorized in controller)
router.post("/", auth_middleware_1.authMiddleware, offers_controller_1.create);
router.patch("/:id", auth_middleware_1.authMiddleware, offers_controller_1.update);
router.delete("/:id", auth_middleware_1.authMiddleware, offers_controller_1.remove);
exports.default = router;
