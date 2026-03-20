"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, {
        expiresIn: "30d",
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, {
        expiresIn: "7d",
    });
};
exports.generateRefreshToken = generateRefreshToken;
