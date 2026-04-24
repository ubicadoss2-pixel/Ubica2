"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeem = exports.getByCode = exports.listActive = exports.listByPlace = exports.remove = exports.update = exports.create = void 0;
const promotions_schema_1 = require("./promotions.schema");
const promotions_service_1 = require("./promotions.service");
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    if (param === undefined)
        throw new Error("Parámetro requerido");
    return param;
};
const create = async (req, res) => {
    try {
        const validated = promotions_schema_1.createPromotionSchema.parse(req.body);
        const promotion = await (0, promotions_service_1.createPromotion)(validated);
        res.status(201).json(promotion);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const id = getParam(req.params.id);
        const validated = promotions_schema_1.updatePromotionSchema.parse(req.body);
        const promotion = await (0, promotions_service_1.updatePromotion)(id, validated);
        res.json(promotion);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        const id = getParam(req.params.id);
        await (0, promotions_service_1.deletePromotion)(id);
        res.json({ message: "Promotion deleted" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.remove = remove;
const listByPlace = async (req, res) => {
    try {
        const placeId = getParam(req.params.placeId);
        const promotions = await (0, promotions_service_1.getPromotionsByPlace)(placeId);
        res.json(promotions);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listByPlace = listByPlace;
const listActive = async (req, res) => {
    try {
        const cityId = req.query.cityId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const promotions = await (0, promotions_service_1.getActivePromotions)(cityId, page, pageSize);
        res.json(promotions);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listActive = listActive;
const getByCode = async (req, res) => {
    try {
        const code = getParam(req.params.code);
        const promotion = await (0, promotions_service_1.getPromotionByCode)(code);
        if (!promotion) {
            return res.status(404).json({ message: "Promoción no encontrada" });
        }
        res.json(promotion);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getByCode = getByCode;
const redeem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = promotions_schema_1.redeemPromotionSchema.parse(req.body);
        if (!code) {
            return res.status(400).json({ message: "Código requerido" });
        }
        const redemption = await (0, promotions_service_1.redeemPromotionByCode)(code, userId);
        res.json({ message: "Promoción canjeada", redemption });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.redeem = redeem;
