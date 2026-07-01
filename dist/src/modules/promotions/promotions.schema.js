"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemPromotionSchema = exports.updatePromotionSchema = exports.createPromotionSchema = void 0;
const zod_1 = require("zod");
exports.createPromotionSchema = zod_1.z.object({
    placeId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    discountType: zod_1.z.enum(["PERCENTAGE", "FIXED", "BOGO"]),
    discountValue: zod_1.z.number().optional(),
    code: zod_1.z.string().max(50).optional(),
    minPurchase: zod_1.z.number().optional(),
    maxUses: zod_1.z.number().optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    imageUrl: zod_1.z.string().url().optional(),
    terms: zod_1.z.string().optional(),
});
exports.updatePromotionSchema = exports.createPromotionSchema.partial();
exports.redeemPromotionSchema = zod_1.z.object({
    code: zod_1.z.string().optional(),
});
