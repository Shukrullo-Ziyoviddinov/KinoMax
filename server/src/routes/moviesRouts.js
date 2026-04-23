const express = require("express");
const Movie = require("../models/movies");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await Movie.find().sort({ movieId: 1 }).lean();
    const data = rows.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id ?? movieId,
    }));
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, message: "Noto'g'ri id." });
    }

    const row = await Movie.findOne({ movieId: id }).lean();
    if (!row) {
      return res.status(404).json({ ok: false, message: "Kino topilmadi." });
    }

    const { _id, movieId, createdAt, updatedAt, ...movie } = row;
    return res.json({
      ok: true,
      data: {
        ...movie,
        id: movie.id ?? movieId,
      },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
