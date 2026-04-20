const movies = require("../../../client/src/data/movies.json");

function getMovieByCode(code) {
  return movies.find((movie) => movie.movieCode === code) || null;
}

module.exports = {
  getMovieByCode,
};
