const express = require("express");
const Genre = require("../models/genres");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const genres = await Genre.find({ isActive: true }).sort({
      sortOrder: 1,
      genreId: 1,
    });
    res.json({ ok: true, data: genres });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
