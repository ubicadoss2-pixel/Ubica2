import { z } from "zod";

export const favoriteSchema = z.object({
  placeId: z.string().uuid(),
});

export type FavoriteDTO = z.infer<typeof favoriteSchema>;

