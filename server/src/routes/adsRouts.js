const express = require("express");
const Ads = require("../models/ads");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await Ads.find().sort({ isActive: -1, sortOrder: 1, adId: 1 }).lean();
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/active", async (_req, res) => {
  try {
    const activeAd = await Ads.findOne({ isActive: true })
      .sort({ sortOrder: 1, adId: 1 })
      .lean();

    if (activeAd) {
      return res.json({ ok: true, data: activeAd });
    }

    const fallbackAd = await Ads.findOne().sort({ sortOrder: 1, adId: 1 }).lean();
    return res.json({ ok: true, data: fallbackAd || null });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
