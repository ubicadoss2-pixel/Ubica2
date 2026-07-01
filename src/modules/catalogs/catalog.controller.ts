import { Request, Response } from "express";
import { listCities, listEventCategories, listPlaceTypes, getMapData } from "./catalog.service";

export const getCities = async (_req: Request, res: Response) => {
  const cities = await listCities();
  res.json(cities);
};

export const getPlaceTypes = async (_req: Request, res: Response) => {
  const types = await listPlaceTypes();
  res.json(types);
};

export const getEventCategories = async (_req: Request, res: Response) => {
  const categories = await listEventCategories();
  res.json(categories);
};

export const getMapPoints = async (_req: Request, res: Response) => {
  const data = await getMapData();
  res.json(data);
};

