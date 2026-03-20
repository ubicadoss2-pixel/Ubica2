import { Request, Response } from "express";
import { favoriteSchema } from "./favorite.schema";
import { addFavorite, listFavorites, removeFavorite } from "./favorite.service";

export const add = async (req: any, res: Response) => {
  try {
    const payload = favoriteSchema.parse({ placeId: req.params.placeId });
    const favorite = await addFavorite(req.user.id, payload.placeId);
    res.status(201).json(favorite);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: any, res: Response) => {
  try {
    const payload = favoriteSchema.parse({ placeId: req.params.placeId });
    await removeFavorite(req.user.id, payload.placeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const list = async (req: any, res: Response) => {
  try {
    const items = await listFavorites(req.user.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

