import { Request, Response } from "express";
import { z } from "zod";
import {
  addPlanFavorite,
  removePlanFavorite,
  getUserPlanFavorites,
  isPlanFavorited,
} from "./plan-favorites.service";

const planIdSchema = z.object({
  planId: z.string().uuid(),
});

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const favorites = await getUserPlanFavorites(userId);
    res.json(favorites);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { planId } = planIdSchema.parse(req.body);
    const favorite = await addPlanFavorite(userId, planId);
    res.status(201).json(favorite);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const planId = Array.isArray(req.params.planId) 
      ? req.params.planId[0] 
      : req.params.planId;
    await removePlanFavorite(userId, planId);
    res.json({ message: "Removed from favorites" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const planId = Array.isArray(req.params.planId) 
      ? req.params.planId[0] 
      : req.params.planId;
    const isFavorited = await isPlanFavorited(userId, planId);
    res.json({ isFavorited });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
