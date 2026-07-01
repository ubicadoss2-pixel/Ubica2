import { z } from "zod";

export const createCommentSchema = z.object({
  placeId: z.string().optional(),
  eventId: z.string().optional(),
  content: z.string().min(2).max(1000),
  rating: z.preprocess((val) => (val === "" || val === undefined || val === null) ? undefined : Number(val), z.number().int().min(1).max(5).optional()),
});

export type CreateCommentDTO = z.infer<typeof createCommentSchema>;
