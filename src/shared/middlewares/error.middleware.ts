import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response) => {
  console.log(`[404] Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Ruta no encontrada" });
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Error interno";
  res.status(status).json({ message });
};

