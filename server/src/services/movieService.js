const Movie = require("../models/movies");

async function getMovieByCode(code) {
  const numericCode = Number(code);
  if (!Number.isFinite(numericCode)) {
    return null;
  }

  const movie = await Movie.findOne({ movieCode: numericCode }).select("-__v").lean();
  return movie || null;
}

async function getAllMovies() {
  return Movie.find().sort({ movieId: 1 }).select("-__v").lean();
}

module.exports = {
  getMovieByCode,
  getAllMovies,
};
