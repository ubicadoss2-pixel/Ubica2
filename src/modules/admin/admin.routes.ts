import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import {
  activityReport,
  approveBusiness,
  approveEvent,
  auditLogs,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  listComments,
  listConflicts,
  listRoles,
  listUsers,
  moderateComment,
  suspendUser,
  updateConflict,
  updateEventStatus,
  updatePlaceStatus,
  updateRole,
  updateUser,
  validateBusiness,
  validateEvent,
} from "./admin.controller";

const router = Router();

router.patch("/places/:id/status", authMiddleware, authorize("ADMIN"), updatePlaceStatus);
router.patch("/events/:id/status", authMiddleware, authorize("ADMIN"), updateEventStatus);

router.patch("/businesses/:id/validate", authMiddleware, authorize("ADMIN"), validateBusiness);
router.patch("/businesses/:id/approve", authMiddleware, authorize("ADMIN"), approveBusiness);
router.patch("/events/:id/validate", authMiddleware, authorize("ADMIN"), validateEvent);
router.patch("/events/:id/approve", authMiddleware, authorize("ADMIN"), approveEvent);

router.get("/roles", authMiddleware, authorize("ADMIN"), listRoles);
router.post("/roles", authMiddleware, authorize("ADMIN"), createRole);
router.patch("/roles/:id", authMiddleware, authorize("ADMIN"), updateRole);
router.delete("/roles/:id", authMiddleware, authorize("ADMIN"), deleteRole);

router.get("/users", authMiddleware, authorize("ADMIN"), listUsers);
router.post("/users", authMiddleware, authorize("ADMIN"), createUser);
router.patch("/users/:id", authMiddleware, authorize("ADMIN"), updateUser);
router.patch("/users/:id/suspend", authMiddleware, authorize("ADMIN"), suspendUser);
router.delete("/users/:id", authMiddleware, authorize("ADMIN"), deleteUser);

router.get("/activity-report", authMiddleware, authorize("ADMIN"), activityReport);

router.get("/comments", authMiddleware, authorize("ADMIN"), listComments);
router.patch("/comments/:id/moderate", authMiddleware, authorize("ADMIN"), moderateComment);

router.get("/conflicts", authMiddleware, authorize("ADMIN"), listConflicts);
router.patch("/conflicts/:id", authMiddleware, authorize("ADMIN"), updateConflict);

router.get("/audit", authMiddleware, authorize("ADMIN"), auditLogs);

export default router;
