import { Request, Response } from "express";
import {
  setPreferenceSchema,
  setManyPreferencesSchema,
} from "./preferences.schema";
import {
  getUserPreferences,
  setPreference,
  setManyPreferences,
  deletePreference,
  getKnownPreferences,
} from "./preferences.service";

export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const preferences = await getUserPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

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
