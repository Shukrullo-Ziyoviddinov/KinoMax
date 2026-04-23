const express = require("express");
const Banner = require("../models/banner");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, bannerId: 1 });
    res.json({ ok: true, data: banners });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/active", async (req, res) => {
  try {
    const { lang } = req.query;
    const query = { isActive: true };

    if (lang) {
      query.lang = lang;
    }

    const banners = await Banner.find(query).sort({ sortOrder: 1, bannerId: 1 });
    res.json({ ok: true, data: banners });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ ok: true, data: banner });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({ ok: false, message: "Banner topilmadi." });
    }

    return res.json({ ok: true, data: banner });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ ok: false, message: "Banner topilmadi." });
    }

    return res.json({ ok: true, message: "Banner o'chirildi." });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
});

module.exports = router;
