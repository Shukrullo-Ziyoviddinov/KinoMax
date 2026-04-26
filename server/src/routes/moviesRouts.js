const express = require("express");
const Movie = require("../models/movies");
const { success, fail } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");
const { validateIdParam } = require("../middlewares/validateRequest");
const { buildTopRatedMovies } = require("../services/topRatedService");
const { toPublicMovie, buildSimilarMovies } = require("../services/similarMoviesService");
const authMiddleware = require("../middlewares/auth.middleware");
const MovieComment = require("../models/movieComment");

const router = express.Router();

const toCommentTree = (rows = []) => {
  const byParent = new Map();
  rows.forEach((row) => {
    const parentKey = row.parentId ? String(row.parentId) : "root";
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push(row);
  });

  const build = (parentKey) =>
    (byParent.get(parentKey) || []).map((row) => ({
      id: String(row._id),
      movieId: row.movieId,
      parentId: row.parentId ? String(row.parentId) : null,
      text: row.text,
      authorName: row.authorName,
      authorAvatar: row.authorAvatar || null,
      createdAt: row.createdAt,
      likes: row.likes || 0,
      replies: build(String(row._id)),
    }));

  return build("root");
};

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

router.get("/:movieId/comments", validateIdParam("movieId"), async (req, res, next) => {
  try {
    const comments = await MovieComment.find({ movieId: req.params.movieId })
      .sort({ createdAt: -1 })
      .lean();
    return success(res, toCommentTree(comments), "Kommentlar olindi.");
  } catch (error) {
    return next(error);
  }
});

router.post("/:movieId/comments", validateIdParam("movieId"), authMiddleware, async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();
    const parentId = req.body?.parentId || null;

    if (!text) {
      return fail(res, "Komment matni bo'sh bo'lmasligi kerak.", 400);
    }

    const newComment = await MovieComment.create({
      movieId: req.params.movieId,
      parentId: parentId || null,
      text,
      authorId: req.user._id,
      authorName: [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim() || "User",
      authorAvatar: req.user.avatar || null,
      likes: 0,
    });

    return success(
      res,
      {
        id: String(newComment._id),
        movieId: newComment.movieId,
        parentId: newComment.parentId ? String(newComment.parentId) : null,
        text: newComment.text,
        authorName: newComment.authorName,
        authorAvatar: newComment.authorAvatar || null,
        createdAt: newComment.createdAt,
        likes: newComment.likes || 0,
      },
      "Komment qo'shildi.",
      201
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", validateIdParam("id"), async (req, res, next) => {
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

router.get("/:id/similar", validateIdParam("id"), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const currentRow = await Movie.findOne({ movieId: req.params.id }).select("-__v").lean();
    if (!currentRow) {
      return fail(res, "Kino topilmadi.", 404);
    }

    const currentMovie = toPublicMovie(currentRow);
    const rows = await Movie.find().select("-__v").lean();
    const candidates = rows.map(toPublicMovie);
    const similarMovies = buildSimilarMovies({ currentMovie, candidates });
    const paginatedItems = similarMovies.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );

    return success(
      res,
      paginatedItems,
      "O'xshash kinolar",
      200,
      buildPaginationMeta(similarMovies.length, pagination)
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
