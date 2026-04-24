import { Request, Response } from "express";
import {
  setPreferenceSchema,
  setManyPreferencesSchema,
} from "./preferences.schema";
import {
  getUserPreferences,
  getFavoriteCategories,
  getAllCategories,
  setPreference,
  setManyPreferences,
  setManyPreferencesRaw,
  setFavoriteCategories,
  deletePreference,
  getKnownPreferences,
} from "./preferences.service";

/**
 * GET /api/preferences
 * Obtiene las preferencias del usuario autenticado
 */
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Obtener preferencias clave-valor
    const prefsObj = await getUserPreferences(userId);
    
    // Obtener categorías favoritas
    const categories = await getFavoriteCategories(userId);
    
    res.status(200).json({
      preferences: prefsObj,
      favoriteCategories: categories,
    });
  } catch (error: any) {
    console.error("Error getting preferences:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/preferences
 * Actualiza las preferencias del usuario usando la estructura del frontend
 */
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { 
      notifications_enabled, 
      email_notifications, 
      theme, 
      language, 
      font_size,
      favoriteCategories
    } = req.body;
    
    // Guardar preferencias simples
    const prefs: Record<string, string> = {};
    if (notifications_enabled !== undefined) prefs.notifications_enabled = String(notifications_enabled);
    if (email_notifications !== undefined) prefs.email_notifications = String(email_notifications);
    if (theme !== undefined) prefs.theme = String(theme);
    if (language !== undefined) prefs.language = String(language);
    if (font_size !== undefined) prefs.font_size = String(font_size);
    
    if (Object.keys(prefs).length > 0) {
      await setManyPreferencesRaw(userId, prefs);
    }
    
    // Guardar categorías favoritas
    if (favoriteCategories && Array.isArray(favoriteCategories)) {
      // Primero obtener todas las categorías para mapear código a ID
      const allCategories = await getAllCategories();
      const categoryMap = new Map((allCategories as any[]).map(c => [c.code, c.id]));
      
      const categoryIdsToSave: string[] = [];
      for (const code of favoriteCategories) {
        const categoryId = categoryMap.get(code);
        if (categoryId) {
          categoryIdsToSave.push(categoryId);
        }
      }
      await setFavoriteCategories(userId, categoryIdsToSave);
    }
    
    res.json({ 
      message: "Preferencias actualizadas correctamente",
      saved: true
    });
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/preferences/categories
 * Obtiene todas las categorías disponibles
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Viejos endpoints por retrocompatibilidad
export const updatePreference = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = setPreferenceSchema.parse(req.body);
    const preference = await setPreference(userId, validated);
    res.json(preference);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateManyPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = setManyPreferencesSchema.parse(req.body);
    const preferences = await setManyPreferences(userId, validated);
    res.json(preferences);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removePreference = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    await deletePreference(userId, key);
    res.json({ message: "Preference deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listKnownPreferences = async (req: Request, res: Response) => {
  try {
    const known = await getKnownPreferences();
    res.json(known);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getDefaultPreferences = async (_req: Request, res: Response) => {
  res.json({
    preferences: {
      theme: 'light',
      language: 'es',
      font_size: 'medium',
      notifications_enabled: 'true',
    }
  });
};
