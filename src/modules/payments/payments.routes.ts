import { Router } from "express";
import { promoteTarget } from "./payments.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

// Health check for this subrouter
router.get("/ping", (_req, res) => {
  res.json({ ok: true, routes: ["POST /promote"] });
});

router.post("/promote", authMiddleware, promoteTarget);

export default router;
