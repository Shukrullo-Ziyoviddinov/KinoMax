const express = require("express");
const Ads = require("../models/ads");
const { success } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const total = await Ads.countDocuments();
    const rows = await applyPagination(
      Ads.find().sort({ isActive: -1, sortOrder: 1, adId: 1 }).select("-__v"),
      pagination
    ).lean();
    return success(res, rows, "Reklamalar ro'yxati", 200, buildPaginationMeta(total, pagination));
  } catch (error) {
    return next(error);
  }
});

router.get("/active", async (_req, res, next) => {
  try {
    const activeAd = await Ads.findOne({ isActive: true })
      .sort({ sortOrder: 1, adId: 1 })
      .lean();

    if (activeAd) {
      return success(res, activeAd, "Aktiv reklama");
    }

    const fallbackAd = await Ads.findOne().sort({ sortOrder: 1, adId: 1 }).lean();
    return success(res, fallbackAd || null, "Fallback reklama");
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
