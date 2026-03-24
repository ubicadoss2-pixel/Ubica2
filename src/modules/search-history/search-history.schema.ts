import { z } from "zod";

export const createSearchHistorySchema = z.object({
  query: z.string().min(1).max(255),
  cityId: z.string().optional(),
  placeTypeId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusKm: z.number().optional(),
  resultsCount: z.number().optional(),
});

export type CreateSearchHistoryDTO = z.infer<typeof createSearchHistorySchema>;
