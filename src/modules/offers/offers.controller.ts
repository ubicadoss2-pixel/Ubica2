import { Request, Response } from "express";
import { createOfferSchema, updateOfferSchema } from "./offers.schema";
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getOffersByPlace,
  getActiveOffers,
  getOffersByOwner,
} from "./offers.service";
import { prisma } from "../../config/prisma";

export const listByOwner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }
    const offers = await getOffersByOwner(userId);
    res.json(offers);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error fetching offers" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const validated = createOfferSchema.parse(req.body);
    
    // Verify place belongs to owner
    const place = await prisma.place.findUnique({ where: { id: validated.placeId } });
    if (!place || place.ownerUserId !== (req as any).user?.id) {
      return res.status(403).json({ error: "No tienes permiso para crear ofertas en este lugar" });
    }

    const offer = await createOffer(validated);
    res.status(201).json(offer);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error creating offer" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validated = updateOfferSchema.parse(req.body);
    
    const existing = await prisma.offer.findUnique({ where: { id }, include: { place: true } });
    if (!existing || existing.place.ownerUserId !== (req as any).user?.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta oferta" });
    }

    const offer = await updateOffer(id, validated);
    res.json(offer);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error updating offer" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.offer.findUnique({ where: { id }, include: { place: true } });
    if (!existing || existing.place.ownerUserId !== (req as any).user?.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta oferta" });
    }

    await deleteOffer(id);
    res.json({ message: "Offer deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error deleting offer" });
  }
};

export const listByPlace = async (req: Request, res: Response) => {
  try {
    const placeId = req.params.placeId as string;
    const offers = await getOffersByPlace(placeId);
    res.json(offers);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error fetching offers" });
  }
};

export const listActive = async (req: Request, res: Response) => {
  try {
    const cityId = req.query.cityId as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const offers = await getActiveOffers(cityId, page, pageSize);
    res.json(offers);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error fetching offers" });
  }
};
