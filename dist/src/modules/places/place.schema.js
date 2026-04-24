"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeStatusSchema = exports.updatePlaceSchema = exports.createPlaceSchema = exports.openingHourSchema = exports.placeSocialSchema = exports.placeContactSchema = void 0;
const zod_1 = require("zod");
exports.placeContactSchema = zod_1.z.object({
    contactType: zod_1.z.enum(["WHATSAPP", "PHONE", "EMAIL", "WEBSITE"]),
    label: zod_1.z.string().max(80).optional(),
    value: zod_1.z.string().min(3).max(240),
    isPrimary: zod_1.z.boolean().optional(),
});
exports.placeSocialSchema = zod_1.z.object({
    platform: zod_1.z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "YOUTUBE", "OTHER"]),
    url: zod_1.z.string().url().max(400),
});
exports.openingHourSchema = zod_1.z.object({
    weekday: zod_1.z.number().int().min(0).max(6),
    openTime: zod_1.z.string().optional(),
    closeTime: zod_1.z.string().optional(),
    isClosed: zod_1.z.boolean().optional(),
});
exports.createPlaceSchema = zod_1.z.object({
    cityId: zod_1.z.string().uuid(),
    placeTypeId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(3).max(180),
    description: zod_1.z.string().optional(),
    addressLine: zod_1.z.string().max(240).optional(),
    neighborhood: zod_1.z.string().max(140).optional(),
    postalCode: zod_1.z.string().max(20).optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    priceLevel: zod_1.z.number().int().min(1).max(5).optional(),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]).optional(),
    contacts: zod_1.z.array(exports.placeContactSchema).optional(),
    socialLinks: zod_1.z.array(exports.placeSocialSchema).optional(),
    openingHours: zod_1.z.array(exports.openingHourSchema).optional(),
    photos: zod_1.z.array(zod_1.z.string().max(500)).optional(),
});
exports.updatePlaceSchema = exports.createPlaceSchema.partial();
exports.placeStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]),
});
