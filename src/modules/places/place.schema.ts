import { z } from "zod";

export const placeContactSchema = z.object({
  contactType: z.enum(["WHATSAPP", "PHONE", "EMAIL", "WEBSITE"]),
  label: z.string().max(80).optional(),
  value: z.string().min(3).max(240),
  isPrimary: z.boolean().optional(),
});

export const placeSocialSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "YOUTUBE", "OTHER"]),
  url: z.string().url().max(400),
});

export const openingHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  isClosed: z.boolean().optional(),
});

export const createPlaceSchema = z.object({
  cityId: z.string().uuid(),
  placeTypeId: z.string().uuid(),
  name: z.string().min(3).max(180),
  description: z.string().optional(),
  addressLine: z.string().max(240).optional(),
  neighborhood: z.string().max(140).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priceLevel: z.number().int().min(1).max(5).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]).optional(),
  contacts: z.array(placeContactSchema).optional(),
  socialLinks: z.array(placeSocialSchema).optional(),
  openingHours: z.array(openingHourSchema).optional(),
  photos: z.array(z.string().max(500)).optional(),
});

export const updatePlaceSchema = createPlaceSchema.partial();

export const placeStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]),
});

export type CreatePlaceDTO = z.infer<typeof createPlaceSchema>;
export type UpdatePlaceDTO = z.infer<typeof updatePlaceSchema>;

