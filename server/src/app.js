const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const bannerRoutes = require("./routes/bannerRoutes");
const actorsRoutes = require("./routes/actorsRouts");
const genresRoutes = require("./routes/genresRouts");
const socialLinkRoutes = require("./routes/socialLinkRouts");
const moviesCatalogRoutes = require("./routes/moviesCatalogRouts");
require("dotenv").config();

const app = express();
connectDB();

app.use(express.json());
app.use("/api/banners", bannerRoutes);
app.use("/api/actors", actorsRoutes);
app.use("/api/genres", genresRoutes);
app.use("/api/social-links", socialLinkRoutes);
app.use("/api/movies-catalog", moviesCatalogRoutes);

app.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    message: "Server ishlayapti",
    db: dbConnected ? "connected" : "disconnected",
  });
});

module.exports = app;
