"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsSchema = void 0;
const zod_1 = require("zod");
exports.createAnalyticsSchema = zod_1.z.object({
    eventType: zod_1.z.enum([
        "PLACE_VIEW",
        "EVENT_VIEW",
        "CONTACT_CLICK",
        "FAVORITE_ADD",
        "FAVORITE_REMOVE",
        "REPORT_CREATE",
    ]),
    placeId: zod_1.z.string().uuid().optional(),
    eventId: zod_1.z.string().uuid().optional(),
    meta: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
