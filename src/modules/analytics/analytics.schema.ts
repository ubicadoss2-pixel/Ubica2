import { z } from "zod";

export const createAnalyticsSchema = z.object({
  eventType: z.enum([
    "PLACE_VIEW",
    "EVENT_VIEW",
    "CONTACT_CLICK",
    "FAVORITE_ADD",
    "FAVORITE_REMOVE",
    "REPORT_CREATE",
  ]),
  placeId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export type CreateAnalyticsDTO = z.infer<typeof createAnalyticsSchema>;
