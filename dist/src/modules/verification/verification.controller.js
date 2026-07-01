"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVerificationStatus = exports.getVerifications = exports.submitVerification = exports.getMyStatus = void 0;
const verification_service_1 = require("./verification.service");
const getMyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const verification = await (0, verification_service_1.getMyVerification)(userId);
        res.json(verification);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMyStatus = getMyStatus;
const submitVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, documentType, documentNumber } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: "Se requiere un archivo adjunto apto (JPG, PNG o PDF)." });
        }
        if (!fullName || !documentType || !documentNumber) {
            return res.status(400).json({ message: "Por favor provea nombre completo, tipo y número de documento" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const verification = await (0, verification_service_1.createVerification)({
            userId,
            fullName,
            documentType,
            documentNumber,
            fileUrl,
        });
        res.status(201).json(verification);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.submitVerification = submitVerification;
const getVerifications = async (req, res) => {
    try {
        const verifications = await (0, verification_service_1.listVerifications)();
        res.json(verifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getVerifications = getVerifications;
const updateVerificationStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Estado inválido." });
        }
        const updated = await (0, verification_service_1.changeStatus)(id, status);
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateVerificationStatus = updateVerificationStatus;
