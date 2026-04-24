"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agenda = exports.listByPlace = exports.getById = exports.update = exports.create = void 0;
const event_schema_1 = require("./event.schema");
const event_service_1 = require("./event.service");
const create = async (req, res) => {
    try {
        const payload = event_schema_1.createEventSchema.parse(req.body);
        const isAdmin = req.user.role === "ADMIN";
        const event = await (0, event_service_1.createEvent)(payload, req.user.id, isAdmin);
        res.status(201).json(event);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const payload = event_schema_1.updateEventSchema.parse(req.body);
        const isAdmin = req.user.role === "ADMIN";
        const event = await (0, event_service_1.updateEvent)(req.params.id, payload, req.user.id, isAdmin);
        res.json(event);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.update = update;
const getById = async (req, res) => {
    try {
        const eventId = String(req.params.id);
        const event = await (0, event_service_1.getEventById)(eventId);
        if (!event)
            return res.status(404).json({ message: "Evento no encontrado" });
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getById = getById;
const listByPlace = async (req, res) => {
    try {
        const placeId = String(req.params.placeId);
        const result = await (0, event_service_1.listEventsByPlace)(placeId, req.query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listByPlace = listByPlace;
const agenda = async (req, res) => {
    try {
        const result = await (0, event_service_1.listAgenda)(req.query, req.user?.id, req.user?.role);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.agenda = agenda;
