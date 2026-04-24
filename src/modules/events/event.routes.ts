import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { agenda, create, getById, listByPlace, update } from "./event.controller";

const router = Router();

router.get("/agenda", authMiddleware, agenda);
router.get("/place/:placeId", listByPlace);
router.get("/:id", getById);

router.post("/", authMiddleware, authorize("OWNER", "ADMIN"), create);
router.patch("/:id", authMiddleware, authorize("OWNER", "ADMIN"), update);

export default router;

