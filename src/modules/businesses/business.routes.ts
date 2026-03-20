import { Router } from "express";
import { create, uploadImage, getById, deleteImageController } from "./business.controller";
import { setPrimaryImageController } from "./business.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import { upload } from "../../shared/middlewares/upload.middleware";
import { nearby } from "./business.controller";
import { checkBusinessLimitByPlan } from "../../shared/middlewares/plan-business.middleware";


const router = Router();

// 🔥 ESTA ES LA QUE TE FALTABA
router.post(
  "/",
  authMiddleware,
  authorize("merchant", "admin"),
  checkBusinessLimitByPlan,
  create
);



router.post(
  "/:id/image",
  authMiddleware,
  authorize("merchant", "admin"),
  upload.single("image"),
  uploadImage
);

router.post(
  "/:id/image/:imageId/primary",
  authMiddleware,
  authorize("merchant", "admin"),
  setPrimaryImageController
);

router.delete(
  "/:id/image/:imageId",
  authMiddleware,
  authorize("merchant", "admin"),
  deleteImageController
);

router.get("/:id", getById);

router.get("/nearby", nearby);



export default router;
