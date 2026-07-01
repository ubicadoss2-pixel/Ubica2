import { Router } from "express";
import {
  getPreferences,
  updatePreferences,
  getCategories,
  updatePreference,
  updateManyPreferences,
  removePreference,
  listKnownPreferences,
  getDefaultPreferences,
} from "./preferences.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/defaults", getDefaultPreferences);

router.use(authMiddleware);

// Nuevos endpoints integrados para HU-02
router.get("/", getPreferences);
router.put("/", updatePreferences);
router.get("/categories", getCategories);

// Endpoints clásicos
router.post("/", updatePreference);
router.post("/bulk", updateManyPreferences);
router.get("/known", listKnownPreferences);
router.delete("/:key", removePreference);

export default router;
