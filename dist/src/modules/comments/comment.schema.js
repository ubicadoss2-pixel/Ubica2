"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = void 0;
const zod_1 = require("zod");
exports.createCommentSchema = zod_1.z.object({
    placeId: zod_1.z.string().optional(),
    eventId: zod_1.z.string().optional(),
    content: zod_1.z.string().min(2).max(1000),
    rating: zod_1.z.preprocess((val) => (val === "" || val === undefined || val === null) ? undefined : Number(val), zod_1.z.number().int().min(1).max(5).optional()),
});
