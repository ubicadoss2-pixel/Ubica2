import { Router } from "express";
import { getCities, getEventCategories, getPlaceTypes, getMapPoints } from "./catalog.controller";

const router = Router();

router.get("/cities", getCities);
router.get("/place-types", getPlaceTypes);
router.get("/event-categories", getEventCategories);
router.get("/map", getMapPoints);

export default router;

