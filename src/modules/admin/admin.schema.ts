import { z } from "zod";

export const placeStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]),
});

export const eventStatusSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED", "SUSPENDED"]),
});

export const roleCreateSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(3).max(160).optional(),
  phone: z.string().min(7).max(30).optional(),
  roleCode: z.string().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(3).max(160).optional(),
  phone: z.string().min(7).max(30).optional(),
  password: z.string().min(6).optional(),
  roleCode: z.string().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
});

export const commentModerationSchema = z.object({
  status: z.enum(["VISIBLE", "EDITED", "HIDDEN", "BLOCKED"]),
  content: z.string().min(1).max(1000).optional(),
});

export const reportUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});
