import { z } from "zod";

export const setPreferenceSchema = z.object({
  key: z.string().min(1).max(60),
  value: z.string().min(1),
});

export const setManyPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      key: z.string().min(1).max(60),
      value: z.string().min(1),
    })
  ),
});

export type SetPreferenceDTO = z.infer<typeof setPreferenceSchema>;
export type SetManyPreferencesDTO = z.infer<typeof setManyPreferencesSchema>;
