const express = require("express");
const Movie = require("../models/movies");
const { success, fail } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");
const { validateIdParam } = require("../middlewares/validateRequest");
const { buildTopRatedMovies } = require("../services/topRatedService");
const { toPublicMovie, buildSimilarMovies } = require("../services/similarMoviesService");
const { buildSimilarTrailers } = require("../services/similarTrailersService");
const authMiddleware = require("../middlewares/auth.middleware");
const MovieComment = require("../models/movieComment");
const User = require("../models/User");
const { verifyToken } = require("../utils/token");

const router = express.Router();

const getOptionalUserId = async (req) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) return null;
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select("_id").lean();
    return user?._id ? String(user._id) : null;
  } catch (_error) {
    return null;
  }
};

const toCommentTree = (rows = [], authorMap = new Map(), currentUserId = null) => {
  const byParent = new Map();
  rows.forEach((row) => {
    const parentKey = row.parentId ? String(row.parentId) : "root";
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push(row);
  });

  const build = (parentKey) =>
    (byParent.get(parentKey) || []).map((row) => ({
      // Always prefer current profile data so old comments show fresh avatar/name.
      ...(authorMap.get(String(row.authorId)) || {}),
      id: String(row._id),
      movieId: row.movieId,
      parentId: row.parentId ? String(row.parentId) : null,
      text: row.text,
      authorName: (authorMap.get(String(row.authorId))?.authorName || row.authorName),
      authorAvatar: (authorMap.get(String(row.authorId))?.authorAvatar ?? row.authorAvatar ?? null),
      createdAt: row.createdAt,
      likes: row.likes || 0,
      likedByMe: currentUserId ? (row.likedBy || []).some((id) => String(id) === String(currentUserId)) : false,
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
    const currentUserId = await getOptionalUserId(req);
    const comments = await MovieComment.find({ movieId: req.params.movieId })
      .sort({ createdAt: -1 })
      .lean();

    const authorIds = [...new Set(comments.map((item) => String(item.authorId)).filter(Boolean))];
    let authorMap = new Map();
    if (authorIds.length > 0) {
      const authors = await User.find({ _id: { $in: authorIds } })
        .select("firstName lastName avatar")
        .lean();

      authorMap = new Map(
        authors.map((user) => {
          const authorName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "User";
          return [String(user._id), { authorName, authorAvatar: user.avatar || null }];
        })
      );
    }

    return success(res, toCommentTree(comments, authorMap, currentUserId), "Kommentlar olindi.");
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
        likedByMe: false,
      },
      "Komment qo'shildi.",
      201
    );
  } catch (error) {
    return next(error);
  }
});

router.post("/:movieId/comments/:commentId/like", validateIdParam("movieId"), authMiddleware, async (req, res, next) => {
  try {
    const comment = await MovieComment.findOneAndUpdate(
      {
        _id: req.params.commentId,
        movieId: req.params.movieId,
      },
      {
        $addToSet: { likedBy: req.user._id },
      },
      { new: true }
    );

    if (!comment) {
      return fail(res, "Komment topilmadi.", 404);
    }

    const actualLikes = Array.isArray(comment.likedBy) ? comment.likedBy.length : 0;
    if ((comment.likes || 0) !== actualLikes) {
      comment.likes = actualLikes;
      await comment.save();
    }

    return success(res, { likes: actualLikes, likedByMe: true }, "Kommentga like bosildi.");
  } catch (error) {
    return next(error);
  }
});

router.delete("/:movieId/comments/:commentId/like", validateIdParam("movieId"), authMiddleware, async (req, res, next) => {
  try {
    const comment = await MovieComment.findOneAndUpdate(
      {
        _id: req.params.commentId,
        movieId: req.params.movieId,
      },
      {
        $pull: { likedBy: req.user._id },
      },
      { new: true }
    );

    if (!comment) {
      return fail(res, "Komment topilmadi.", 404);
    }

    const actualLikes = Array.isArray(comment.likedBy) ? comment.likedBy.length : 0;
    if ((comment.likes || 0) !== actualLikes) {
      comment.likes = actualLikes;
      await comment.save();
    }

    return success(res, { likes: actualLikes, likedByMe: false }, "Komment like'i olib tashlandi.");
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/similar-trailers", validateIdParam("id"), async (req, res, next) => {
  try {
    const currentTrailerId = Number.parseInt(req.query?.trailerId, 10);
    const typeTrailers = String(req.query?.typeTrailers || "").trim();
    const limit = Number.parseInt(req.query?.limit, 10) || 12;

    if (!Number.isFinite(currentTrailerId)) {
      return fail(res, "Noto'g'ri trailerId.", 400);
    }
    if (!typeTrailers) {
      return success(res, [], "O'xshash treylerlar");
    }

    const rows = await Movie.find().select("-__v").lean();
    const movies = rows.map(toPublicMovie);
    const items = buildSimilarTrailers({
      movies,
      currentMovieId: req.params.id,
      currentTrailerId,
      typeTrailers,
      limit,
    });

    return success(res, items, "O'xshash treylerlar");
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
