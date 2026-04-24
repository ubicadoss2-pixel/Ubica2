"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = void 0;
const zod_1 = require("zod");
exports.createCommentSchema = zod_1.z.object({
    placeId: zod_1.z.string().uuid().optional(),
    eventId: zod_1.z.string().uuid().optional(),
    content: zod_1.z.string().min(2).max(1000),
    rating: zod_1.z.number().int().min(1).max(5).optional(),
}).refine(data => data.placeId || data.eventId, {
    message: "Debe proveer placeId o eventId",
});
