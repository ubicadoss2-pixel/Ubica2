"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    targetType: zod_1.z.enum(["PLACE", "EVENT"]),
    placeId: zod_1.z.string().uuid().optional(),
    eventId: zod_1.z.string().uuid().optional(),
    reason: zod_1.z.enum(["WRONG_INFO", "SPAM", "INAPPROPRIATE", "CLOSED", "OTHER"]),
    details: zod_1.z.string().optional(),
});
exports.updateReportSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});
