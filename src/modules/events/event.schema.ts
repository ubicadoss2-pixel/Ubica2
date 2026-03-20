import { z } from "zod";

export const eventRecurrenceSchema = z.object({
  weekday: z.number().int().min(0).max(6),
});

export const eventSpecialDateSchema = z.object({
  eventDate: z.string(),
  dateType: z.enum(["OCCURRENCE", "EXCEPTION"]).optional(),
  note: z.string().max(250).optional(),
});

export const createEventSchema = z.object({
  placeId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  addressLine: z.string().max(240).optional(),
  neighborhood: z.string().max(140).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dressCode: z.string().max(120).optional(),
  minAge: z.number().int().min(0).max(99).optional(),
  currency: z.string().length(3).optional(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "SUSPENDED"]).optional(),
  recurrence: eventRecurrenceSchema.optional(),
  specialDates: z.array(eventSpecialDateSchema).optional(),
  photos: z.array(z.string().max(500)).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;

