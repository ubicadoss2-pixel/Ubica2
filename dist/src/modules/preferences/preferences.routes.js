"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const preferences_controller_1 = require("./preferences.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/defaults", preferences_controller_1.getDefaultPreferences);
router.use(auth_middleware_1.authMiddleware);
// Nuevos endpoints integrados para HU-02
router.get("/", preferences_controller_1.getPreferences);
router.put("/", preferences_controller_1.updatePreferences);
router.get("/categories", preferences_controller_1.getCategories);
// Endpoints clásicos
router.post("/", preferences_controller_1.updatePreference);
router.post("/bulk", preferences_controller_1.updateManyPreferences);
router.get("/known", preferences_controller_1.listKnownPreferences);
router.delete("/:key", preferences_controller_1.removePreference);
exports.default = router;
