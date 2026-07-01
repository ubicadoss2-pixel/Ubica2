import { z } from "zod";

const baseOfferSchema = z.object({
  placeId: z.string().uuid("Invalid Place ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional(),
  conditions: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createOfferSchema = baseOfferSchema.refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateOfferSchema = baseOfferSchema.partial().refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type CreateOfferDTO = z.infer<typeof createOfferSchema>;
export type UpdateOfferDTO = z.infer<typeof updateOfferSchema>;
