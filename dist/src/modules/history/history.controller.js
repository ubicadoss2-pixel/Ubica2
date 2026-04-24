"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearHistory = exports.addHistory = exports.getHistory = void 0;
const history_service_1 = require("./history.service");
/**
 * GET /api/history
 * Obtiene el historial de lugares y eventos consultados por el usuario
 */
const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const history = await (0, history_service_1.getUserHistory)(userId, limit);
        const items = history;
        if (items.length === 0) {
            return res.json({
                items: [],
                total: 0,
                message: "No tienes historial de consultas. ¡Explora lugares y eventos!"
            });
        }
        res.json({
            items,
            total: items.length,
            example: {
                items: [
                    {
                        id: "uuid",
                        item_id: "place-uuid",
                        item_type: "place",
                        item_name: "La Terraza",
                        item_description: "Zona Rosa",
                        viewed_at: "2026-03-26T10:30:00Z"
                    }
                ]
            }
        });
    }
    catch (error) {
        console.error("Error getting history:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getHistory = getHistory;
/**
 * POST /api/history
 * Registra una vista de lugar o evento en el historial
 */
const addHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id, item_type } = req.body;
        if (!item_id || !item_type) {
            return res.status(400).json({ error: "item_id y item_type son requeridos" });
        }
        if (!['place', 'event'].includes(item_type)) {
            return res.status(400).json({ error: "item_type debe ser 'place' o 'event'" });
        }
        await (0, history_service_1.addToHistory)(userId, item_id, item_type);
        res.status(201).json({
            message: "Historial actualizado",
            added: true
        });
    }
    catch (error) {
        console.error("Error adding to history:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.addHistory = addHistory;
/**
 * DELETE /api/history
 * Limpia todo el historial del usuario
 */
const clearHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, history_service_1.clearUserHistory)(userId);
        res.json({
            message: "Historial limpiado correctamente",
            cleared: true
        });
    }
    catch (error) {
        console.error("Error clearing history:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.clearHistory = clearHistory;
