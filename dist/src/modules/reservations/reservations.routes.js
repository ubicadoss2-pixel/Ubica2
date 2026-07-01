"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservations_controller_1 = require("./reservations.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/confirm", auth_middleware_1.authMiddleware, reservations_controller_1.confirmReservation);
router.get("/owner", auth_middleware_1.authMiddleware, reservations_controller_1.getOwnerReservations);
exports.default = router;
