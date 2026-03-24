import { Router } from "express";
import {
  getPreferences,
  updatePreference,
  updateManyPreferences,
  removePreference,
  listKnownPreferences,
} from "./preferences.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getPreferences);
router.post("/", updatePreference);
router.post("/bulk", updateManyPreferences);
router.delete("/:key", removePreference);
router.get("/known", listKnownPreferences);

export default router;
