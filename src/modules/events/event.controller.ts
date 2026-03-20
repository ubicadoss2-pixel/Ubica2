import { Request, Response } from "express";
import { createEventSchema, updateEventSchema } from "./event.schema";
import { createEvent, getEventById, listAgenda, listEventsByPlace, updateEvent } from "./event.service";

export const create = async (req: any, res: Response) => {
  try {
    const payload = createEventSchema.parse(req.body);
    const isAdmin = req.user.role === "ADMIN";
    const event = await createEvent(payload, req.user.id, isAdmin);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: any, res: Response) => {
  try {
    const payload = updateEventSchema.parse(req.body);
    const isAdmin = req.user.role === "ADMIN";
    const event = await updateEvent(req.params.id, payload, req.user.id, isAdmin);
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);
    const event = await getEventById(eventId);
    if (!event) return res.status(404).json({ message: "Evento no encontrado" });
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listByPlace = async (req: Request, res: Response) => {
  try {
    const placeId = String(req.params.placeId);
    const result = await listEventsByPlace(placeId, req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const agenda = async (req: Request, res: Response) => {
  try {
    const result = await listAgenda(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
