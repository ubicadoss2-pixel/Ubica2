import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().max(160).optional(),
  username: z.string().max(100).optional(),
  birthDate: z.string().optional(),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().max(5000000).optional().or(z.literal("")),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
