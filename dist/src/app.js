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
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const comment_routes_1 = __importDefault(require("./modules/comments/comment.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const preferences_routes_1 = __importDefault(require("./modules/preferences/preferences.routes"));
const search_history_routes_1 = __importDefault(require("./modules/search-history/search-history.routes"));
const offers_routes_1 = __importDefault(require("./modules/offers/offers.routes"));
const chatbot_routes_1 = __importDefault(require("./modules/chatbot/chatbot.routes"));
const user_blocks_routes_1 = __importDefault(require("./modules/user-blocks/user-blocks.routes"));
const history_routes_1 = __importDefault(require("./modules/history/history.routes"));
const verification_routes_1 = __importDefault(require("./modules/verification/verification.routes"));
const reservations_routes_1 = __importDefault(require("./modules/reservations/reservations.routes"));
const error_middleware_1 = require("./shared/middlewares/error.middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10000,
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
app.use("/api/payments", payments_routes_1.default);
console.log("✅ Payment routes registered at /api/payments");
app.use("/api/reviews", comment_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/preferences", preferences_routes_1.default);
app.use("/api/search-history", search_history_routes_1.default);
app.use("/api/offers", offers_routes_1.default);
app.use("/api/chatbot", chatbot_routes_1.default);
app.use("/api/user-blocks", user_blocks_routes_1.default);
app.use("/api/history", history_routes_1.default);
app.use("/api/verificacion", verification_routes_1.default);
app.use("/api/reservations", reservations_routes_1.default);
app.use("/uploads", express_1.default.static("uploads"));
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
