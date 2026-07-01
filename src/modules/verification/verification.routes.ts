import { Router } from "express";
import { submitVerification, getVerifications, updateVerificationStatus, getMyStatus } from "./verification.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authorize } from "../../shared/middlewares/role.middleware";
import multer from "multer";
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Formato no válido. Sólo JPG, PNG o PDF."));
    }
  },
});

const router = Router();

router.get("/me", authMiddleware, getMyStatus);
router.post("/", authMiddleware, upload.single("archivo"), submitVerification);
router.get("/", authMiddleware, authorize("ADMIN"), getVerifications);
router.put("/:id", authMiddleware, authorize("ADMIN"), updateVerificationStatus);

export default router;
