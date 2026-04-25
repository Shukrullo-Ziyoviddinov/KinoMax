const express = require("express");
const Movie = require("../models/movies");
const { buildMoviesCatalog } = require("../utils/moviesCatalogTransform");
const { success } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const total = await Movie.countDocuments();
    const rawMovies = await applyPagination(
      Movie.find().sort({ movieId: 1 }).select("-__v"),
      pagination
    ).lean();
    const movies = rawMovies.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id || movieId,
    }));

    const payload = buildMoviesCatalog(movies);
    return success(
      res,
      payload,
      "Katalog ma'lumotlari",
      200,
      buildPaginationMeta(total, pagination)
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
