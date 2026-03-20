import { z } from "zod";

export const subscribePlanSchema = z.object({
  planId: z.string().uuid(),
});

export type SubscribePlanDTO = z.infer<typeof subscribePlanSchema>;
