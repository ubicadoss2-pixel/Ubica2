"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.remove = exports.add = void 0;
const favorite_schema_1 = require("./favorite.schema");
const favorite_service_1 = require("./favorite.service");
const add = async (req, res) => {
    try {
        const payload = favorite_schema_1.favoriteSchema.parse({ placeId: req.params.placeId });
        const favorite = await (0, favorite_service_1.addFavorite)(req.user.id, payload.placeId);
        res.status(201).json(favorite);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.add = add;
const remove = async (req, res) => {
    try {
        const payload = favorite_schema_1.favoriteSchema.parse({ placeId: req.params.placeId });
        await (0, favorite_service_1.removeFavorite)(req.user.id, payload.placeId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.remove = remove;
const list = async (req, res) => {
    try {
        const items = await (0, favorite_service_1.listFavorites)(req.user.id);
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.list = list;
