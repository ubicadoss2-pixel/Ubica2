import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
