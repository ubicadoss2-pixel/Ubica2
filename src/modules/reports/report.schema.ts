import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["PLACE", "EVENT"]),
  placeId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  reason: z.enum(["WRONG_INFO", "SPAM", "INAPPROPRIATE", "CLOSED", "OTHER"]),
  details: z.string().optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});

export type CreateReportDTO = z.infer<typeof createReportSchema>;
export type UpdateReportDTO = z.infer<typeof updateReportSchema>;

