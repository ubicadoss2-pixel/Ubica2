"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summary = exports.create = void 0;
const analytics_schema_1 = require("./analytics.schema");
const analytics_service_1 = require("./analytics.service");
const create = async (req, res) => {
    try {
        const payload = analytics_schema_1.createAnalyticsSchema.parse(req.body);
        const event = await (0, analytics_service_1.createAnalyticsEvent)(payload, req.user?.id);
        res.status(201).json(event);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.create = create;
const summary = async (req, res) => {
    try {
        const role = req.user.role;
        let ownerId;
        if (role === "OWNER") {
            ownerId = req.user.id;
        }
        else if (role === "ADMIN") {
            ownerId = req.query.ownerId ? String(req.query.ownerId) : undefined;
        }
        const data = await (0, analytics_service_1.summaryAnalytics)(ownerId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.summary = summary;
