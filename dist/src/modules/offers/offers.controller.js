"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActive = exports.listByPlace = exports.remove = exports.update = exports.create = void 0;
const offers_schema_1 = require("./offers.schema");
const offers_service_1 = require("./offers.service");
const prisma_1 = require("../../config/prisma");
const create = async (req, res) => {
    try {
        const validated = offers_schema_1.createOfferSchema.parse(req.body);
        // Verify place belongs to owner
        const place = await prisma_1.prisma.place.findUnique({ where: { id: validated.placeId } });
        if (!place || place.ownerUserId !== req.user?.id) {
            return res.status(403).json({ error: "No tienes permiso para crear ofertas en este lugar" });
        }
        const offer = await (0, offers_service_1.createOffer)(validated);
        res.status(201).json(offer);
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Error creating offer" });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const id = req.params.id;
        const validated = offers_schema_1.updateOfferSchema.parse(req.body);
        const existing = await prisma_1.prisma.offer.findUnique({ where: { id }, include: { place: true } });
        if (!existing || existing.place.ownerUserId !== req.user?.id) {
            return res.status(403).json({ error: "No tienes permiso para modificar esta oferta" });
        }
        const offer = await (0, offers_service_1.updateOffer)(id, validated);
        res.json(offer);
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Error updating offer" });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.offer.findUnique({ where: { id }, include: { place: true } });
        if (!existing || existing.place.ownerUserId !== req.user?.id) {
            return res.status(403).json({ error: "No tienes permiso para eliminar esta oferta" });
        }
        await (0, offers_service_1.deleteOffer)(id);
        res.json({ message: "Offer deleted" });
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Error deleting offer" });
    }
};
exports.remove = remove;
const listByPlace = async (req, res) => {
    try {
        const placeId = req.params.placeId;
        const offers = await (0, offers_service_1.getOffersByPlace)(placeId);
        res.json(offers);
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Error fetching offers" });
    }
};
exports.listByPlace = listByPlace;
const listActive = async (req, res) => {
    try {
        const cityId = req.query.cityId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offers = await (0, offers_service_1.getActiveOffers)(cityId, page, pageSize);
        res.json(offers);
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Error fetching offers" });
    }
};
exports.listActive = listActive;
