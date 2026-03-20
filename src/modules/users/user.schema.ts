import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().max(160).optional(),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
