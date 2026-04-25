const express = require("express");
const Genre = require("../models/genres");
const { success } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination } = require("../utils/queryOptimizer");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const query = { isActive: true };
    const total = await Genre.countDocuments(query);
    const genres = await applyPagination(
      Genre.find(query).sort({ sortOrder: 1, genreId: 1 }).select("-__v"),
      pagination
    ).lean();
    return success(res, genres, "Janrlar ro'yxati", 200, buildPaginationMeta(total, pagination));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
