const express = require("express");
const Movie = require("../models/movies");
const User = require("../models/User");
const { buildMoviesCatalog } = require("../utils/moviesCatalogTransform");
const { success } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");
const { verifyToken } = require("../utils/token");

const router = express.Router();

const resolveOptionalUser = async (req) => {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  try {
    const payload = verifyToken(token);
    if (!payload?.userId) return null;
    return await User.findById(payload.userId).lean();
  } catch (_error) {
    return null;
  }
};

const loadPopularMovieScores = async () => {
  const rows = await User.aggregate([
    { $unwind: { path: "$viewedMovies", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: "$viewedMovies.movieId",
        totalViews: { $sum: { $ifNull: ["$viewedMovies.viewCount", 1] } },
        uniqueUsers: { $sum: 1 },
      },
    },
    { $sort: { totalViews: -1, uniqueUsers: -1 } },
    { $limit: 200 },
  ]);

  const maxViews = rows.length ? Math.max(...rows.map((row) => Number(row.totalViews) || 0), 1) : 1;
  const scores = new Map();
  rows.forEach((row) => {
    const movieId = Number(row?._id);
    if (!Number.isFinite(movieId)) return;
    const totalViews = Number(row?.totalViews) || 0;
    const uniqueUsers = Number(row?.uniqueUsers) || 0;
    const normalizedViews = totalViews / maxViews;
    const uniquenessBoost = Math.min(uniqueUsers / 10, 1) * 0.2;
    scores.set(movieId, normalizedViews + uniquenessBoost);
  });
  return scores;
};

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

    const user = await resolveOptionalUser(req);
    const popularMovieScores = await loadPopularMovieScores();
    const payload = buildMoviesCatalog(movies, { user, popularMovieScores });
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
