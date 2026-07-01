import { Request, Response } from "express";
import { blockUserSchema } from "./user-blocks.service";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isBlocked,
} from "./user-blocks.service";

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  if (param === undefined) throw new Error("Parámetro requerido");
  return param;
};

export const block = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = blockUserSchema.parse(req.body);
    const block = await blockUser(userId, validated);
    res.status(201).json(block);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unblock = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const blockedId = getParam(req.params.blockedId);
    await unblockUser(userId, blockedId);
    res.json({ message: "Usuario desbloqueado" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listBlocked = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const blocked = await getBlockedUsers(userId);
    res.json(blocked);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const checkBlocked = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetId = getParam(req.params.userId);
    const blocked = await isBlocked(userId, targetId);
    res.json({ isBlocked: blocked });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
