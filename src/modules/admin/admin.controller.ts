import { Request, Response } from "express";
import {
  activityReportAdmin,
  approveBusinessAdmin,
  approveEventAdmin,
  createRoleAdmin,
  createUserAdmin,
  deleteRoleAdmin,
  deleteUserAdmin,
  listAuditLogs,
  listCommentsAdmin,
  listConflictsAdmin,
  listRolesAdmin,
  listUsersAdmin,
  moderateCommentAdmin,
  moderateEventAdmin,
  moderatePlaceAdmin,
  listPendingPlacesAdmin,
  suspendUserAdmin,
  updateConflictAdmin,
  updateEventStatusAdmin,
  updatePlaceStatusAdmin,
  updateRoleAdmin,
  updateUserAdmin,
} from "./admin.service";
import {
  commentModerationSchema,
  eventStatusSchema,
  placeStatusSchema,
  reportUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "./admin.schema";

export const updatePlaceStatus = async (req: any, res: Response) => {
  try {
    const { status } = placeStatusSchema.parse(req.body);
    const result = await updatePlaceStatusAdmin(req.params.id, status, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEventStatus = async (req: any, res: Response) => {
  try {
    const { status } = eventStatusSchema.parse(req.body);
    const result = await updateEventStatusAdmin(req.params.id, status, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listPendingPlaces = async (_req: any, res: Response) => {
  try {
    const places = await listPendingPlacesAdmin();
    res.json(places);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const moderatePlace = async (req: any, res: Response) => {
  try {
    const { status, reason } = req.body;
    const result = await moderatePlaceAdmin(req.params.id, status, req.user.id, reason);
    res.json({ message: status === "PUBLISHED" ? "Negocio aprobado correctamente" : "Negocio rechazado correctamente", ...result });
  } catch (error: any) {
    res.status(400).json({ message: "No se pudo actualizar el estado del negocio" });
  }
};

export const moderateEvent = async (req: any, res: Response) => {
  try {
    const { status, reason } = req.body;
    const result = await moderateEventAdmin(req.params.id, status, req.user.id, reason);
    res.json({ message: status === "ACTIVE" ? "Evento aprobado correctamente" : "Evento rechazado correctamente", ...result });
  } catch (error: any) {
    res.status(400).json({ message: "No se pudo actualizar el estado del evento" });
  }
};

export const listRoles = async (_req: Request, res: Response) => {
  try {
    const result = await listRolesAdmin();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req: any, res: Response) => {
  try {
    const payload = roleCreateSchema.parse(req.body);
    const result = await createRoleAdmin(payload, req.user.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req: any, res: Response) => {
  try {
    const payload = roleUpdateSchema.parse(req.body);
    const result = await updateRoleAdmin(req.params.id, payload, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req: any, res: Response) => {
  try {
    const result = await deleteRoleAdmin(req.params.id, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string | undefined,
      roleCode: req.query.roleCode as string | undefined,
      includeDeleted: req.query.includeDeleted === "true",
    };
    const result = await listUsersAdmin(query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: any, res: Response) => {
  try {
    const payload = userCreateSchema.parse(req.body);
    const result = await createUserAdmin(payload, req.user.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req: any, res: Response) => {
  try {
    const payload = userUpdateSchema.parse(req.body);
    const result = await updateUserAdmin(req.params.id, payload, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const suspendUser = async (req: any, res: Response) => {
  try {
    const result = await suspendUserAdmin(req.params.id, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    const result = await deleteUserAdmin(req.params.id, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const activityReport = async (_req: Request, res: Response) => {
  try {
    const result = await activityReportAdmin();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listComments = async (req: Request, res: Response) => {
  try {
    const result = await listCommentsAdmin({ status: req.query.status as string | undefined });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const moderateComment = async (req: any, res: Response) => {
  try {
    const payload = commentModerationSchema.parse(req.body);
    const result = await moderateCommentAdmin(req.params.id, payload, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listConflicts = async (req: Request, res: Response) => {
  try {
    const result = await listConflictsAdmin(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateConflict = async (req: any, res: Response) => {
  try {
    const payload = reportUpdateSchema.parse(req.body);
    const result = await updateConflictAdmin(req.params.id, payload, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const auditLogs = async (_req: Request, res: Response) => {
  try {
    const items = await listAuditLogs();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
