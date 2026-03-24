import { Router } from "express";
import { block, unblock, listBlocked, checkBlocked } from "./user-blocks.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", block);
router.delete("/:blockedId", unblock);
router.get("/", listBlocked);
router.get("/:userId/check", checkBlocked);

export default router;
