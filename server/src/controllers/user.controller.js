const { success } = require("../utils/apiResponse");
const toMovieId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
const toReaction = (value) => (value === "like" || value === "dislike" ? value : null);
const toTrailerKey = (movieId, trailerId) => {
  const mId = toMovieId(movieId);
  const tId = toMovieId(trailerId);
  if (mId === null || tId === null) return null;
  return `${mId}-${tId}`;
};

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    return success(res, {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar || null,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar } = req.body || {};

    if (typeof firstName === "string") req.user.firstName = firstName.trim();
    if (typeof lastName === "string") req.user.lastName = lastName.trim();
    if (avatar !== undefined) req.user.avatar = avatar || null;

    await req.user.save();

    return success(res, {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phone: req.user.phone,
      avatar: req.user.avatar || null,
    }, "Profil muvaffaqiyatli yangilandi.");
  } catch (error) {
    return next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = Array.isArray(req.user.wishlist) ? req.user.wishlist : [];
    return success(res, { wishlist }, "Wishlist olindi.");
  } catch (error) {
    return next(error);
  }
};

const addWishlistItem = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.body?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }

    const current = Array.isArray(req.user.wishlist) ? req.user.wishlist : [];
    if (!current.includes(movieId)) {
      req.user.wishlist = [...current, movieId];
      await req.user.save();
    }

    return success(res, { wishlist: req.user.wishlist }, "Wishlistga qo'shildi.");
  } catch (error) {
    return next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.params?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }

    const current = Array.isArray(req.user.wishlist) ? req.user.wishlist : [];
    req.user.wishlist = current.filter((id) => id !== movieId);
    await req.user.save();

    return success(res, { wishlist: req.user.wishlist }, "Wishlistdan olib tashlandi.");
  } catch (error) {
    return next(error);
  }
};

const getMovieReaction = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.params?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    const reaction = req.user.movieReactions?.get(String(movieId)) || null;
    return success(res, { reaction }, "Movie reaction olindi.");
  } catch (error) {
    return next(error);
  }
};

const setMovieReaction = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.body?.movieId);
    const reaction = toReaction(req.body?.reaction);
    if (movieId === null || !reaction) {
      const error = new Error("movieId yoki reaction noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    req.user.movieReactions.set(String(movieId), reaction);
    await req.user.save();
    return success(res, { reaction }, "Movie reaction saqlandi.");
  } catch (error) {
    return next(error);
  }
};

const removeMovieReaction = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.params?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    req.user.movieReactions.delete(String(movieId));
    await req.user.save();
    return success(res, { reaction: null }, "Movie reaction olib tashlandi.");
  } catch (error) {
    return next(error);
  }
};

const getTrailerReactionsByMovie = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.query?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    const entries = Object.fromEntries(req.user.trailerReactions || []);
    const reactions = {};
    Object.entries(entries).forEach(([key, value]) => {
      if (key.startsWith(`${movieId}-`) && toReaction(value)) {
        reactions[key] = value;
      }
    });
    return success(res, { reactions }, "Trailer reactions olindi.");
  } catch (error) {
    return next(error);
  }
};

const setTrailerReaction = async (req, res, next) => {
  try {
    const reaction = toReaction(req.body?.reaction);
    const key = toTrailerKey(req.body?.movieId, req.body?.trailerId);
    if (!reaction || !key) {
      const error = new Error("movieId, trailerId yoki reaction noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    req.user.trailerReactions.set(key, reaction);
    await req.user.save();
    return success(res, { reaction }, "Trailer reaction saqlandi.");
  } catch (error) {
    return next(error);
  }
};

const removeTrailerReaction = async (req, res, next) => {
  try {
    const key = toTrailerKey(req.params?.movieId, req.params?.trailerId);
    if (!key) {
      const error = new Error("movieId yoki trailerId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }
    req.user.trailerReactions.delete(key);
    await req.user.save();
    return success(res, { reaction: null }, "Trailer reaction olib tashlandi.");
  } catch (error) {
    return next(error);
  }
};

const getViewedMovies = async (req, res, next) => {
  try {
    const viewedMovies = Array.isArray(req.user.viewedMovies) ? req.user.viewedMovies : [];
    return success(res, { viewedMovies }, "Ko'rilgan kinolar olindi.");
  } catch (error) {
    return next(error);
  }
};

const addViewedMovie = async (req, res, next) => {
  try {
    const movieId = toMovieId(req.body?.movieId);
    if (movieId === null) {
      const error = new Error("movieId noto'g'ri.");
      error.statusCode = 400;
      throw error;
    }

    const viewedMovies = Array.isArray(req.user.viewedMovies) ? req.user.viewedMovies : [];
    const existing = viewedMovies.find((item) => Number(item.movieId) === movieId);
    if (existing) {
      existing.viewCount = Math.max(1, Number(existing.viewCount) || 1) + 1;
      existing.viewedAt = new Date();
    } else {
      viewedMovies.unshift({ movieId, viewedAt: new Date(), viewCount: 1 });
    }

    req.user.viewedMovies = viewedMovies
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 150);

    await req.user.save();
    return success(res, { viewedMovies: req.user.viewedMovies }, "Ko'rilgan kino saqlandi.");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
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
};
