"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventSchema = exports.createEventSchema = exports.eventSpecialDateSchema = exports.eventRecurrenceSchema = void 0;
const zod_1 = require("zod");
exports.eventRecurrenceSchema = zod_1.z.object({
    weekday: zod_1.z.number().int().min(0).max(6),
});
exports.eventSpecialDateSchema = zod_1.z.object({
    eventDate: zod_1.z.string(),
    dateType: zod_1.z.enum(["OCCURRENCE", "EXCEPTION"]).optional(),
    note: zod_1.z.string().max(250).optional(),
});
exports.createEventSchema = zod_1.z.object({
    placeId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().optional(),
    dressCode: zod_1.z.string().max(120).optional(),
    minAge: zod_1.z.number().int().min(0).max(99).optional(),
    currency: zod_1.z.string().length(3).optional(),
    priceFrom: zod_1.z.number().optional(),
    priceTo: zod_1.z.number().optional(),
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "CANCELLED", "SUSPENDED"]).optional(),
    recurrence: exports.eventRecurrenceSchema.optional(),
    specialDates: zod_1.z.array(exports.eventSpecialDateSchema).optional(),
});
exports.updateEventSchema = exports.createEventSchema.partial();
