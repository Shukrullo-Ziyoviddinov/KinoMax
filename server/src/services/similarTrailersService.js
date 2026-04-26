const normalizeString = (value) => String(value || "").trim();

const toNumberOrNull = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractTrailerSrc = (trailer = {}) =>
  normalizeString(trailer?.trailers?.uz) ||
  normalizeString(trailer?.trailers?.ru) ||
  "";

const extractTrailerTitle = (trailer = {}) =>
  normalizeString(trailer?.title?.uz) ||
  normalizeString(trailer?.title?.ru) ||
  "";

const buildSimilarTrailers = ({
  movies = [],
  currentMovieId,
  currentTrailerId,
  typeTrailers,
  limit = 12,
}) => {
  const safeType = normalizeString(typeTrailers);
  if (!safeType) return [];

  const targetMovieId = toNumberOrNull(currentMovieId);
  const targetTrailerId = toNumberOrNull(currentTrailerId);
  const seen = new Set();

  return movies
    .flatMap((movie) =>
      (Array.isArray(movie?.trailersVideo) ? movie.trailersVideo : []).map((trailer) => ({
        ...trailer,
        movieId: movie.id ?? movie.movieId,
        movieTitle: movie.title,
      }))
    )
    .filter((trailer) => {
      if (normalizeString(trailer.typeTrailers) !== safeType) return false;
      const trailerMovieId = toNumberOrNull(trailer.movieId);
      const trailerId = toNumberOrNull(trailer.id);
      const isCurrent =
        trailerMovieId !== null &&
        trailerId !== null &&
        trailerMovieId === targetMovieId &&
        trailerId === targetTrailerId;
      return !isCurrent;
    })
    .filter((trailer) => {
      const signature = [
        normalizeString(trailer.movieId),
        normalizeString(trailer.id),
        extractTrailerSrc(trailer),
        extractTrailerTitle(trailer),
      ].join("|");

      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .slice(0, Math.max(1, Number(limit) || 12));
};

module.exports = {
  buildSimilarTrailers,
};
