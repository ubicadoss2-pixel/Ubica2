"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const notFound = (req, res) => {
    console.log(`[404] Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: "Ruta no encontrada" });
};
exports.notFound = notFound;
const errorHandler = (err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.message || "Error interno";
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
