const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getProfile,
  updateProfile,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  getMovieReaction,
  setMovieReaction,
  removeMovieReaction,
  getTrailerReactionsByMovie,
  setTrailerReaction,
  removeTrailerReaction,
  getViewedMovies,
  addViewedMovie,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/wishlist", authMiddleware, getWishlist);
router.post("/wishlist", authMiddleware, addWishlistItem);
router.delete("/wishlist/:movieId", authMiddleware, removeWishlistItem);
router.get("/reactions/movie/:movieId", authMiddleware, getMovieReaction);
router.post("/reactions/movie", authMiddleware, setMovieReaction);
router.delete("/reactions/movie/:movieId", authMiddleware, removeMovieReaction);
router.get("/reactions/trailer", authMiddleware, getTrailerReactionsByMovie);
router.post("/reactions/trailer", authMiddleware, setTrailerReaction);
router.delete("/reactions/trailer/:movieId/:trailerId", authMiddleware, removeTrailerReaction);
router.get("/viewed-movies", authMiddleware, getViewedMovies);
router.post("/viewed-movies", authMiddleware, addViewedMovie);

module.exports = router;
