"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHistoryItem = exports.clearHistory = exports.getHistory = exports.createSearchEntry = void 0;
const search_history_schema_1 = require("./search-history.schema");
const search_history_service_1 = require("./search-history.service");
const createSearchEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = search_history_schema_1.createSearchHistorySchema.parse(req.body);
        const entry = await (0, search_history_service_1.addSearchHistory)(userId, validated);
        res.status(201).json(entry);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createSearchEntry = createSearchEntry;
const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const history = await (0, search_history_service_1.getUserSearchHistory)(userId, pageSize, page);
        res.json(history);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getHistory = getHistory;
const clearHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, search_history_service_1.clearUserSearchHistory)(userId);
        res.json({ message: "History cleared" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.clearHistory = clearHistory;
const deleteHistoryItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await (0, search_history_service_1.deleteSearchHistoryItem)(userId, id);
        res.json({ message: "Item deleted" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteHistoryItem = deleteHistoryItem;
