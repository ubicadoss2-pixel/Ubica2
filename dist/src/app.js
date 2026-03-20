"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const place_routes_1 = __importDefault(require("./modules/places/place.routes"));
const event_routes_1 = __importDefault(require("./modules/events/event.routes"));
const catalog_routes_1 = __importDefault(require("./modules/catalogs/catalog.routes"));
const favorite_routes_1 = __importDefault(require("./modules/favorites/favorite.routes"));
const report_routes_1 = __importDefault(require("./modules/reports/report.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const error_middleware_1 = require("./shared/middlewares/error.middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/catalogs", catalog_routes_1.default);
app.use("/api/places", place_routes_1.default);
app.use("/api/events", event_routes_1.default);
app.use("/api/favorites", favorite_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/analytics", analytics_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
