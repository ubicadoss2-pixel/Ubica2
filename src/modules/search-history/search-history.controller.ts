import { Request, Response } from "express";
import {
  createSearchHistorySchema,
} from "./search-history.schema";
import {
  addSearchHistory,
  getUserSearchHistory,
  clearUserSearchHistory,
  deleteSearchHistoryItem,
} from "./search-history.service";

export const createSearchEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = createSearchHistorySchema.parse(req.body);
    const entry = await addSearchHistory(userId, validated);
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const history = await getUserSearchHistory(userId, pageSize, page);
    res.json(history);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await clearUserSearchHistory(userId);
    res.json({ message: "History cleared" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteHistoryItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSearchHistoryItem(userId, id);
    res.json({ message: "Item deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
