"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalog_controller_1 = require("./catalog.controller");
const router = (0, express_1.Router)();
router.get("/cities", catalog_controller_1.getCities);
router.get("/place-types", catalog_controller_1.getPlaceTypes);
router.get("/event-categories", catalog_controller_1.getEventCategories);
exports.default = router;
