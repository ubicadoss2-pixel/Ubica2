import { z } from "zod";

export const subscribePlanSchema = z.object({
  planId: z.string().min(1),
});

export type SubscribePlanDTO = z.infer<typeof subscribePlanSchema>;
