const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const bannerRoutes = require("./routes/bannerRoutes");
const actorsRoutes = require("./routes/actorsRouts");
const genresRoutes = require("./routes/genresRouts");
const socialLinkRoutes = require("./routes/socialLinkRouts");
const moviesCatalogRoutes = require("./routes/moviesCatalogRouts");
const moviesRoutes = require("./routes/moviesRouts");
const adsRoutes = require("./routes/adsRouts");
require("dotenv").config();

const app = express();
connectDB();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/banners", bannerRoutes);
app.use("/api/actors", actorsRoutes);
app.use("/api/genres", genresRoutes);
app.use("/api/social-links", socialLinkRoutes);
app.use("/api/movies-catalog", moviesCatalogRoutes);
app.use("/api/movies", moviesRoutes);
app.use("/api/ads", adsRoutes);

app.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    message: "Server ishlayapti",
    db: dbConnected ? "connected" : "disconnected",
  });
});

const clientBuildPath = process.env.CLIENT_BUILD_PATH
  ? path.resolve(process.env.CLIENT_BUILD_PATH)
  : path.join(__dirname, "../../client/build");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath, { index: false }));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ ok: false, message: "Endpoint topilmadi" });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

module.exports = app;
