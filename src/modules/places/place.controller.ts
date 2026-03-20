import { Request, Response } from "express";
import { createPlaceSchema, placeStatusSchema, updatePlaceSchema } from "./place.schema";
import { createPlace, getPlaceById, listPlaces, setPlaceStatus, updatePlace } from "./place.service";

export const create = async (req: any, res: Response) => {
  try {
    const payload = createPlaceSchema.parse(req.body);
    const isAdmin = req.user.role === "ADMIN";
    const place = await createPlace(payload, req.user.id, isAdmin);
    res.status(201).json(place);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: any, res: Response) => {
  try {
    const payload = updatePlaceSchema.parse(req.body);
    const isAdmin = req.user.role === "ADMIN";
    const place = await updatePlace(req.params.id, payload, req.user.id, isAdmin);
    res.json(place);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const list = async (req: any, res: Response) => {
  try {
    const result = await listPlaces(req.query, req.user?.id, req.user?.role);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const placeId = String(req.params.id);
    const place = await getPlaceById(placeId);
    if (!place) return res.status(404).json({ message: "Lugar no encontrado" });
    res.json(place);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req: any, res: Response) => {
  try {
    const payload = placeStatusSchema.parse(req.body);
    const place = await setPlaceStatus(req.params.id, payload.status);
    res.json(place);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
