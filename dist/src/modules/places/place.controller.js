"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.getById = exports.list = exports.update = exports.create = void 0;
const place_schema_1 = require("./place.schema");
const place_service_1 = require("./place.service");
const create = async (req, res) => {
    try {
        const payload = place_schema_1.createPlaceSchema.parse(req.body);
        const isAdmin = req.user.role === "ADMIN";
        const place = await (0, place_service_1.createPlace)(payload, req.user.id, isAdmin);
        res.status(201).json(place);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const payload = place_schema_1.updatePlaceSchema.parse(req.body);
        const isAdmin = req.user.role === "ADMIN";
        const place = await (0, place_service_1.updatePlace)(req.params.id, payload, req.user.id, isAdmin);
        res.json(place);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.update = update;
const list = async (req, res) => {
    try {
        const result = await (0, place_service_1.listPlaces)(req.query, req.user?.id, req.user?.role);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.list = list;
const getById = async (req, res) => {
    try {
        const placeId = String(req.params.id);
        if (!placeId || placeId === 'null' || placeId === 'undefined') {
            return res.status(400).json({ message: "ID de lugar inválido" });
        }
        const place = await (0, place_service_1.getPlaceById)(placeId);
        if (!place)
            return res.status(404).json({ message: "Lugar no encontrado" });
        res.json(place);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getById = getById;
const updateStatus = async (req, res) => {
    try {
        const payload = place_schema_1.placeStatusSchema.parse(req.body);
        const place = await (0, place_service_1.setPlaceStatus)(req.params.id, payload.status);
        res.json(place);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateStatus = updateStatus;
