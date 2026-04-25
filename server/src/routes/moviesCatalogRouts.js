const express = require("express");
const Movie = require("../models/movies");
const { buildMoviesCatalog } = require("../utils/moviesCatalogTransform");
const { success } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const rawMovies = await Movie.find()
      .sort({ movieId: 1 })
      .select("-__v")
      .lean();
    const movies = rawMovies.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id || movieId,
    }));

    const payload = buildMoviesCatalog(movies);
    return success(res, payload, "Katalog ma'lumotlari");
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
