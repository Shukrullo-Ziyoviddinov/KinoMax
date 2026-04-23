const express = require("express");
const Actor = require("../models/actors");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const actors = await Actor.find({ isActive: true }).sort({ actorId: 1 });
    res.json({ ok: true, data: actors });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/by-ids", async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));

    if (!ids.length) {
      return res.json({ ok: true, data: [] });
    }

    const actors = await Actor.find({
      actorId: { $in: ids },
      isActive: true,
    }).sort({ actorId: 1 });

    return res.json({ ok: true, data: actors });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const actorId = Number(req.params.id);
    if (!Number.isFinite(actorId)) {
      return res.status(400).json({ ok: false, message: "Noto'g'ri actor id." });
    }

    const actor = await Actor.findOne({ actorId, isActive: true });
    if (!actor) {
      return res.status(404).json({ ok: false, message: "Actor topilmadi." });
    }

    return res.json({ ok: true, data: actor });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
