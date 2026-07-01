"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReport = exports.listReports = exports.createReport = void 0;
const prisma_1 = require("../../config/prisma");
const createReport = async (data, userId) => {
    if (data.targetType === "PLACE" && !data.placeId) {
        throw new Error("placeId es requerido");
    }
    if (data.targetType === "EVENT" && !data.eventId) {
        throw new Error("eventId es requerido");
    }
    return prisma_1.prisma.report.create({
        data: {
            userId: userId || null,
            targetType: data.targetType,
            placeId: data.placeId,
            eventId: data.eventId,
            reason: data.reason,
            details: data.details,
        },
    });
};
exports.createReport = createReport;
const listReports = async (query) => {
    const status = query.status;
    const where = {};
    if (status)
        where.status = status;
    return prisma_1.prisma.report.findMany({
        where,
        include: { place: true, event: true, user: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.listReports = listReports;
const updateReport = async (id, data) => {
    return prisma_1.prisma.report.update({
        where: { id },
        data: {
            status: data.status,
            resolvedAt: ["RESOLVED", "REJECTED"].includes(data.status)
                ? new Date()
                : null,
        },
    });
};
exports.updateReport = updateReport;
