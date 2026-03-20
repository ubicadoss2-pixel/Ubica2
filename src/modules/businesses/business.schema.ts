import { z } from "zod";

export const createBusinessSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  latitud: z.number(),
  longitud: z.number(),
  ciudad: z.string(),
  categoria_id: z.number()
});

export type CreateBusinessDTO =
  z.infer<typeof createBusinessSchema>;
