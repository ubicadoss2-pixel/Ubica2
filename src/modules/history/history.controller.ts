import { Request, Response } from "express";
import {
  getUserHistory,
  addToHistory,
  clearUserHistory
} from "./history.service";

/**
 * GET /api/history
 * Obtiene el historial de lugares y eventos consultados por el usuario
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await getUserHistory(userId, limit);
    const items = history as any[];
    
    if (items.length === 0) {
      return res.json({
        items: [],
        total: 0,
        message: "No tienes historial de consultas. ¡Explora lugares y eventos!"
      });
    }
    
    res.json({
      items,
      total: items.length,
      example: {
        items: [
          {
            id: "uuid",
            item_id: "place-uuid",
            item_type: "place",
            item_name: "La Terraza",
            item_description: "Zona Rosa",
            viewed_at: "2026-03-26T10:30:00Z"
          }
        ]
      }
    });
  } catch (error: any) {
    console.error("Error getting history:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/history
 * Registra una vista de lugar o evento en el historial
 */
export const addHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { item_id, item_type } = req.body;
    
    if (!item_id || !item_type) {
      return res.status(400).json({ error: "item_id y item_type son requeridos" });
    }
    
    if (!['place', 'event'].includes(item_type)) {
      return res.status(400).json({ error: "item_type debe ser 'place' o 'event'" });
    }
    
    await addToHistory(userId, item_id, item_type);
    
    res.status(201).json({ 
      message: "Historial actualizado",
      added: true
    });
  } catch (error: any) {
    console.error("Error adding to history:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/history
 * Limpia todo el historial del usuario
 */
export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await clearUserHistory(userId);
    
    res.json({ 
      message: "Historial limpiado correctamente",
      cleared: true
    });
  } catch (error: any) {
    console.error("Error clearing history:", error);
    res.status(500).json({ error: error.message });
  }
};