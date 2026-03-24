import { Request, Response } from "express";
import {
  createPromotionSchema,
  updatePromotionSchema,
  redeemPromotionSchema,
} from "./promotions.schema";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionsByPlace,
  getActivePromotions,
  getPromotionByCode,
  redeemPromotion,
  redeemPromotionByCode,
} from "./promotions.service";

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  if (param === undefined) throw new Error("Parámetro requerido");
  return param;
};

export const create = async (req: Request, res: Response) => {
  try {
    const validated = createPromotionSchema.parse(req.body);
    const promotion = await createPromotion(validated);
    res.status(201).json(promotion);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const validated = updatePromotionSchema.parse(req.body);
    const promotion = await updatePromotion(id, validated);
    res.json(promotion);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await deletePromotion(id);
    res.json({ message: "Promotion deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listByPlace = async (req: Request, res: Response) => {
  try {
    const placeId = getParam(req.params.placeId);
    const promotions = await getPromotionsByPlace(placeId);
    res.json(promotions);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listActive = async (req: Request, res: Response) => {
  try {
    const cityId = req.query.cityId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const promotions = await getActivePromotions(cityId, page, pageSize);
    res.json(promotions);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getByCode = async (req: Request, res: Response) => {
  try {
    const code = getParam(req.params.code);
    const promotion = await getPromotionByCode(code);
    if (!promotion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }
    res.json(promotion);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const redeem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code } = redeemPromotionSchema.parse(req.body);
    if (!code) {
      return res.status(400).json({ message: "Código requerido" });
    }
    const redemption = await redeemPromotionByCode(code, userId);
    res.json({ message: "Promoción canjeada", redemption });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
