import { Request, Response } from "express";
import { createVerification, listVerifications, changeStatus, getMyVerification } from "./verification.service";

export const getMyStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const verification = await getMyVerification(userId);
    res.json(verification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitVerification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, documentType, documentNumber } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Se requiere un archivo adjunto apto (JPG, PNG o PDF)." });
    }

    if (!fullName || !documentType || !documentNumber) {
      return res.status(400).json({ message: "Por favor provea nombre completo, tipo y número de documento" });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;

    const verification = await createVerification({
      userId,
      fullName,
      documentType,
      documentNumber,
      fileUrl,
    });

    res.status(201).json(verification);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getVerifications = async (req: Request, res: Response) => {
  try {
    const verifications = await listVerifications();
    res.json(verifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVerificationStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const updated = await changeStatus(id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
