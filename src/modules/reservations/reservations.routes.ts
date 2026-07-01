import { Router } from "express";
import { confirmReservation, getOwnerReservations } from "./reservations.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.post("/confirm", authMiddleware, confirmReservation);
router.get("/owner", authMiddleware, getOwnerReservations);

export default router;
