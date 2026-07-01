"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchHistorySchema = void 0;
const zod_1 = require("zod");
exports.createSearchHistorySchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(255),
    cityId: zod_1.z.string().optional(),
    placeTypeId: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    radiusKm: zod_1.z.number().optional(),
    resultsCount: zod_1.z.number().optional(),
});
