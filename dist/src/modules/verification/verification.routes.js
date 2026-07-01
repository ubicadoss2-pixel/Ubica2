"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verification_controller_1 = require("./verification.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const role_middleware_1 = require("../../shared/middlewares/role.middleware");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync("uploads")) {
    fs_1.default.mkdirSync("uploads");
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(new Error("Formato no válido. Sólo JPG, PNG o PDF."));
        }
    },
});
const router = (0, express_1.Router)();
router.get("/me", auth_middleware_1.authMiddleware, verification_controller_1.getMyStatus);
router.post("/", auth_middleware_1.authMiddleware, upload.single("archivo"), verification_controller_1.submitVerification);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("ADMIN"), verification_controller_1.getVerifications);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("ADMIN"), verification_controller_1.updateVerificationStatus);
exports.default = router;
