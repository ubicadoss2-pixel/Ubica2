import { Request, Response } from "express";
import { updateUserSchema } from "./user.schema";
import { getProfile, updateProfile, assignRole, listUsers } from "./user.service";

export const me = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const profile = await getProfile(userId, role);
    
    if (!profile) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMe = async (req: any, res: Response) => {
  try {
    const payload = updateUserSchema.parse(req.body);
    const updated = await updateProfile(req.user.id, payload);
    
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { roleCode } = req.body;

    const validRoles = ["ADMIN", "OWNER", "USER", "COMERCIANTE"]; // COMERCIANTE alias for OWNER
    const normalizedRole = roleCode === "COMERCIANTE" ? "OWNER" : roleCode;

    if (!validRoles.includes(roleCode)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    const updatedUser = await assignRole(id, normalizedRole);
    res.json({ message: "Rol actualizado correctamente", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ message: "Error al actualizar los permisos" });
  }
};

export const getAllUsers = async (req: any, res: Response) => {
  try {
    const result = await listUsers(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


