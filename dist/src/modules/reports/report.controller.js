"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.list = exports.create = void 0;
const report_schema_1 = require("./report.schema");
const report_service_1 = require("./report.service");
const prisma_1 = require("../../config/prisma");
const create = async (req, res) => {
    try {
        const payload = report_schema_1.createReportSchema.parse(req.body);
        const report = await (0, report_service_1.createReport)(payload, req.user?.id);
        await prisma_1.prisma.analyticsEvent.create({
            data: {
                userId: req.user?.id || null,
                placeId: payload.placeId,
                eventId: payload.eventId,
                eventType: "REPORT_CREATE",
            },
        });
        res.status(201).json(report);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.create = create;
const list = async (req, res) => {
    try {
        const items = await (0, report_service_1.listReports)(req.query);
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.list = list;
const update = async (req, res) => {
    try {
        const payload = report_schema_1.updateReportSchema.parse(req.body);
        const reportId = String(req.params.id);
        const report = await (0, report_service_1.updateReport)(reportId, payload);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.update = update;
