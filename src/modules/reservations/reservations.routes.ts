import { Router } from "express";
import { confirmReservation } from "./reservations.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.post("/confirm", authMiddleware, confirmReservation);

export default router;
