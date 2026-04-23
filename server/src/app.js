const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
connectDB();

app.use(express.json());

app.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    message: "Server ishlayapti",
    db: dbConnected ? "connected" : "disconnected",
  });
});

module.exports = app;
