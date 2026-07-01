import { z } from "zod";

export const favoriteSchema = z.object({
  placeId: z.string().uuid(),
});

export const toggleVisitedSchema = z.object({
  isVisited: z.boolean(),
});

export type FavoriteDTO = z.infer<typeof favoriteSchema>;

