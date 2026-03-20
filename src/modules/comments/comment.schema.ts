import { z } from "zod";

export const createCommentSchema = z.object({
  placeId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  content: z.string().min(2).max(1000),
  rating: z.number().int().min(1).max(5).optional(),
}).refine(data => data.placeId || data.eventId, {
  message: "Debe proveer placeId o eventId",
});

export type CreateCommentDTO = z.infer<typeof createCommentSchema>;
