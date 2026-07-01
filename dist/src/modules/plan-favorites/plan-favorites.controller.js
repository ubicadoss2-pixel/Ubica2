"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFavorite = exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const zod_1 = require("zod");
const plan_favorites_service_1 = require("./plan-favorites.service");
const planIdSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
});
const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const favorites = await (0, plan_favorites_service_1.getUserPlanFavorites)(userId);
        res.json(favorites);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getFavorites = getFavorites;
const addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = planIdSchema.parse(req.body);
        const favorite = await (0, plan_favorites_service_1.addPlanFavorite)(userId, planId);
        res.status(201).json(favorite);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.addFavorite = addFavorite;
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const planId = Array.isArray(req.params.planId)
            ? req.params.planId[0]
            : req.params.planId;
        await (0, plan_favorites_service_1.removePlanFavorite)(userId, planId);
        res.json({ message: "Removed from favorites" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.removeFavorite = removeFavorite;
const checkFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const planId = Array.isArray(req.params.planId)
            ? req.params.planId[0]
            : req.params.planId;
        const isFavorited = await (0, plan_favorites_service_1.isPlanFavorited)(userId, planId);
        res.json({ isFavorited });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.checkFavorite = checkFavorite;
