import { Request, Response } from "express";
import { createBusiness } from "./service/business.service";
import { createBusinessSchema } from "./business.schema";
import { addBusinessImage } from "./service/business.image.service";
import { getNearbyBusinesses } from "./service/business.service";
import { setPrimaryImage } from "./service/business.image.service";
import { getBusinessById } from "./service/business.service";
import { deleteBusinessImage } from "./service/business.image.service";


export const create = async (req: any, res: Response) => {
  try {

    const validated = createBusinessSchema.parse(req.body);

    const business = await createBusiness(
      validated,
      req.user.id
    );

    res.status(201).json(business);

  } catch (error: any) {
    res.status(400).json({
      message: error.message
    });
  }
};

export const nearby = async (req: Request, res: Response) => {
  try {

    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 5000;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Debes enviar lat y lng"
      });
    }

    const businesses = await getNearbyBusinesses(
      lat,
      lng,
      radius
    );

    res.json(businesses);

  } catch (error:any) {

    res.status(500).json({
      message: error.message
    });

  }
};

export const setPrimaryImageController = async (req: any, res: any) => {
  try {
    const { id, imageId } = req.params;

    const image = await setPrimaryImage(
      Number(id),
      Number(imageId),
      req.user.id
    );

    res.json(image);

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadImage = async (req: any, res: any) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No enviaste imagen"
      });
    }

    const image = await addBusinessImage(
      Number(req.params.id),
      req.file,
      req.user.id
    );

    res.json(image);

  } catch (error:any) {

    res.status(400).json({
      message: error.message
    });

  }
};

export const getById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const business = await getBusinessById(Number(id));
    if (!business) return res.status(404).json({ message: "Negocio no encontrado" });
    res.json(business);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteImageController = async (req: any, res: any) => {
  try {
    const { id, imageId } = req.params;
    const result = await deleteBusinessImage(Number(id), Number(imageId), req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


