import { Request, Response } from "express";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema";
import { loginUser, registerUser, getUpdatedUserSession, forgotPassword, resetPassword } from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const tokens = await loginUser(validated);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const session = await getUpdatedUserSession(userId);
    res.json(session);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const forgotPwd = async (req: Request, res: Response) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(validated);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPwd = async (req: Request, res: Response) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(validated);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

