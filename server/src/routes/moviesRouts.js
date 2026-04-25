const express = require("express");
const Movie = require("../models/movies");
const { success, fail } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");
const { validateIdParam } = require("../middlewares/validateRequest");
const { buildTopRatedMovies } = require("../services/topRatedService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const total = await Movie.countDocuments();
    const rows = await applyPagination(
      Movie.find().sort({ movieId: 1 }).select("-__v"),
      pagination
    ).lean();
    const data = rows.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id ?? movieId,
    }));
    return success(res, data, "Kinolar ro'yxati", 200, buildPaginationMeta(total, pagination));
  } catch (error) {
    return next(error);
  }
});

router.get("/top-rated", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const rows = await Movie.find().select("-__v").lean();
    const movies = rows.map(({ _id, movieId, createdAt, updatedAt, ...movie }) => ({
      ...movie,
      id: movie.id ?? movieId,
    }));

    const topRatedMovies = buildTopRatedMovies(movies);
    const paginatedItems = topRatedMovies.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );

    return success(
      res,
      paginatedItems,
      "Yuqori reytingli kinolar",
      200,
      buildPaginationMeta(topRatedMovies.length, pagination)
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:id(\\d+)", validateIdParam("id"), async (req, res, next) => {
  try {
    const row = await Movie.findOne({ movieId: req.params.id }).select("-__v").lean();
    if (!row) {
      return fail(res, "Kino topilmadi.", 404);
    }

    const { _id, movieId, createdAt, updatedAt, ...movie } = row;
    return success(
      res,
      {
        ...movie,
        id: movie.id ?? movieId,
      },
      "Kino ma'lumoti"
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
