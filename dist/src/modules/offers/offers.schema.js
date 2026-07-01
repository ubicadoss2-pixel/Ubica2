"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOfferSchema = exports.createOfferSchema = void 0;
const zod_1 = require("zod");
exports.createOfferSchema = zod_1.z.object({
    placeId: zod_1.z.string().uuid("Invalid Place ID"),
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(200),
    description: zod_1.z.string().optional(),
    conditions: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url("Invalid image URL").optional().or(zod_1.z.literal("")),
    startDate: zod_1.z.string().or(zod_1.z.date()).transform((val) => new Date(val)),
    endDate: zod_1.z.string().or(zod_1.z.date()).transform((val) => new Date(val)),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});
exports.updateOfferSchema = exports.createOfferSchema.partial();
