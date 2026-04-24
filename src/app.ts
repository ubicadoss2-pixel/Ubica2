import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./modules/auth/auth.routes";
import placeRoutes from "./modules/places/place.routes";
import eventRoutes from "./modules/events/event.routes";
import catalogRoutes from "./modules/catalogs/catalog.routes";
import favoriteRoutes from "./modules/favorites/favorite.routes";
import reportRoutes from "./modules/reports/report.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import adminRoutes from "./modules/admin/admin.routes";
import planRoutes from "./modules/plans/plan.routes";
import reviewRoutes from "./modules/comments/comment.routes";
import userRoutes from "./modules/users/user.routes";
import preferenceRoutes from "./modules/preferences/preferences.routes";
import planFavoriteRoutes from "./modules/plan-favorites/plan-favorites.routes";
import searchHistoryRoutes from "./modules/search-history/search-history.routes";
import promotionRoutes from "./modules/promotions/promotions.routes";
import chatbotRoutes from "./modules/chatbot/chatbot.routes";
import userBlockRoutes from "./modules/user-blocks/user-blocks.routes";
import historyRoutes from "./modules/history/history.routes";
import verificationRoutes from "./modules/verification/verification.routes";
import { errorHandler, notFound } from "./shared/middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/catalogs", catalogRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/plan-favorites", planFavoriteRoutes);
app.use("/api/search-history", searchHistoryRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/user-blocks", userBlockRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/verificacion", verificationRoutes);
app.use("/uploads", express.static("uploads"));

app.use(notFound);
app.use(errorHandler);

export default app;
