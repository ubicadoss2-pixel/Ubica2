import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import {
  activityReport,
  auditLogs,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  listComments,
  listConflicts,
  listPendingPlaces,
  listRoles,
  listUsers,
  moderateComment,
  moderateEvent,
  moderatePlace,
  suspendUser,
  updateConflict,
  updateEventStatus,
  updatePlaceStatus,
  updateRole,
  updateUser,
} from "./admin.controller";
import { exportReport } from "./exports.controller";

const router = Router();

router.patch("/places/:id/status", authMiddleware, authorize("ADMIN"), updatePlaceStatus);
router.patch("/events/:id/status", authMiddleware, authorize("ADMIN"), updateEventStatus);

router.get("/places/pending", authMiddleware, authorize("ADMIN"), listPendingPlaces);
router.patch("/places/:id/moderate", authMiddleware, authorize("ADMIN"), moderatePlace);
router.patch("/events/:id/moderate", authMiddleware, authorize("ADMIN"), moderateEvent);

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

router.get("/exports/reports", authMiddleware, authorize("ADMIN"), exportReport);

export default router;
