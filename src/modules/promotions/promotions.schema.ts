import { z } from "zod";

export const createPromotionSchema = z.object({
  placeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED", "BOGO"]),
  discountValue: z.number().optional(),
  code: z.string().max(50).optional(),
  minPurchase: z.number().optional(),
  maxUses: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  imageUrl: z.string().url().optional(),
  terms: z.string().optional(),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const redeemPromotionSchema = z.object({
  code: z.string().optional(),
});

export type CreatePromotionDTO = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionDTO = z.infer<typeof updatePromotionSchema>;
export type RedeemPromotionDTO = z.infer<typeof redeemPromotionSchema>;
