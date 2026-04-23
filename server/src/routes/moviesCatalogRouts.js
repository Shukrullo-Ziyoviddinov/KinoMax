const express = require("express");
const MoviesCatalog = require("../models/moviesCatalog");
const { buildMoviesCatalog } = require("../utils/moviesCatalogTransform");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const rawMovies = await MoviesCatalog.find().sort({ movieId: 1 }).lean();
    const movies = rawMovies.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id || movieId,
    }));

    const payload = buildMoviesCatalog(movies);
    return res.json({ ok: true, data: payload });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
