"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = promise_1.default.createPool({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "ubica2_pro",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
// Función helper para ejecutar queries
const query = async (sql, params) => {
    const [rows] = await exports.pool.execute(sql, params);
    return rows;
};
exports.query = query;
exports.default = exports.pool;
