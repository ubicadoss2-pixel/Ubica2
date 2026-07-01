import { Router } from "express";
import { authMiddleware, optionalAuth } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { agenda, create, getById, listByPlace, update, listPending, moderate } from "./event.controller";

const router = Router();

router.get("/agenda", optionalAuth, agenda);
router.get("/place/:placeId", listByPlace);
router.get("/pending", authMiddleware, authorize("ADMIN"), listPending);
router.get("/:id", getById);

router.post("/", authMiddleware, authorize("OWNER", "ADMIN"), create);
router.patch("/:id/moderate", authMiddleware, authorize("ADMIN"), moderate);
router.patch("/:id", authMiddleware, authorize("OWNER", "ADMIN"), update);

export default router;

