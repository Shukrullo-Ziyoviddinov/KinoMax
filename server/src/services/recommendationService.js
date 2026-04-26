const RECOMMENDED_LIMIT = 12;

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeToArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeText(item)).filter(Boolean))];
  }
  const normalized = normalizeText(value);
  return normalized ? [normalized] : [];
};

const recommendationKey = (movie) => {
  const title =
    normalizeText(movie?.title?.uz) ||
    normalizeText(movie?.title?.ru) ||
    normalizeText(movie?.title);
  const year = normalizeText(
    movie?.description?.uz?.year || movie?.description?.ru?.year || movie?.specs?.year
  );
  const image = normalizeText(movie?.homeImg?.uz || movie?.homeImg?.ru);
  return `${title}|${year}|${image}`;
};

const uniqueRecommendations = (items = []) => {
  const used = new Set();
  const result = [];
  items.forEach((movie) => {
    const key = recommendationKey(movie);
    if (!key || used.has(key)) return;
    used.add(key);
    result.push(movie);
  });
  return result;
};

const parseRating = (value, max) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.min(num / max, 1);
};

const getQualityScore = (movie) => {
  const rating = parseRating(movie?.rating, 5);
  const imdb = parseRating(movie?.ratingImdb, 10);
  const kinopoisk = parseRating(movie?.ratingKinopoisk, 10);
  const netflix = parseRating(movie?.ratingNetflix, 5);
  const values = [rating, imdb, kinopoisk, netflix].filter((v) => v !== null);
  if (!values.length) return 0.45;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const getMovieGenres = (movie) => {
  const source = movie?.genre;
  if (!source) return [];
  if (Array.isArray(source)) return normalizeToArray(source);
  if (typeof source === "object") {
    return normalizeToArray([...(source.uz || []), ...(source.ru || [])]);
  }
  return normalizeToArray(source);
};

const toMapEntries = (value) => {
  if (!value) return [];
  if (typeof value.entries === "function") return Array.from(value.entries());
  return Object.entries(value);
};

const buildSignalProfile = (movies = [], user = null) => {
  const movieById = new Map(movies.map((movie) => [Number(movie?.id), movie]));
  const viewedEntries = Array.isArray(user?.viewedMovies) ? user.viewedMovies : [];
  const reactionEntries = toMapEntries(user?.movieReactions);
  const wishlistIds = new Set(Array.isArray(user?.wishlist) ? user.wishlist.map((id) => Number(id)) : []);

  const viewedIds = new Set();
  const genreWeights = new Map();
  const categoryWeights = new Map();
  const likedMovieIds = new Set();

  const addWeight = (map, key, inc) => {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + inc);
  };

  viewedEntries.forEach((entry) => {
    const movieId = Number(entry?.movieId);
    if (!Number.isFinite(movieId)) return;
    const movie = movieById.get(movieId);
    if (!movie) return;
    viewedIds.add(movieId);
    const viewCount = Math.max(1, Number(entry?.viewCount) || 1);
    const viewedAt = entry?.viewedAt ? new Date(entry.viewedAt) : null;
    const daysAgo = viewedAt ? Math.max(0, (Date.now() - viewedAt.getTime()) / (1000 * 60 * 60 * 24)) : 30;
    const recencyBoost = 1 / (1 + daysAgo / 10);
    const weight = viewCount * recencyBoost;

    getMovieGenres(movie).forEach((genre) => addWeight(genreWeights, genre, weight));
    normalizeToArray(movie?.category).forEach((category) => addWeight(categoryWeights, category, weight));
  });

  reactionEntries.forEach(([movieIdRaw, reaction]) => {
    if (reaction !== "like") return;
    const movieId = Number(movieIdRaw);
    const movie = movieById.get(movieId);
    if (!movie) return;
    likedMovieIds.add(movieId);
    getMovieGenres(movie).forEach((genre) => addWeight(genreWeights, genre, 2.5));
    normalizeToArray(movie?.category).forEach((category) => addWeight(categoryWeights, category, 2));
  });

  return {
    viewedIds,
    likedMovieIds,
    wishlistIds,
    genreWeights,
    categoryWeights,
    hasSignals: viewedIds.size > 0 || likedMovieIds.size > 0 || wishlistIds.size > 0,
  };
};

const getPopularityBoost = (movie, popularMovieScores = null) => {
  if (!popularMovieScores) return 0;
  const movieId = Number(movie?.id);
  if (!Number.isFinite(movieId)) return 0;
  return Number(popularMovieScores.get(movieId) || 0);
};

const scoreMovie = (movie, profile, popularMovieScores) => {
  const movieGenres = getMovieGenres(movie);
  const movieCategories = normalizeToArray(movie?.category);

  const genreScore = movieGenres.reduce((sum, genre) => sum + (profile.genreWeights.get(genre) || 0), 0);
  const categoryScore = movieCategories.reduce((sum, category) => sum + (profile.categoryWeights.get(category) || 0), 0);
  const likeBoost = profile.likedMovieIds.has(Number(movie?.id)) ? -4 : 0;
  const wishlistBoost = profile.wishlistIds.has(Number(movie?.id)) ? 0.5 : 0;
  const qualityScore = getQualityScore(movie) * 3;
  const popularityBoost = getPopularityBoost(movie, popularMovieScores) * 0.25;
  const freshnessDays = movie?.createdAt ? (Date.now() - new Date(movie.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 365;
  const freshnessBoost = freshnessDays < 45 ? 0.35 : 0;

  return genreScore * 0.45 + categoryScore * 0.2 + qualityScore * 0.25 + popularityBoost + wishlistBoost + freshnessBoost + likeBoost;
};

const diversify = (items = [], limit = RECOMMENDED_LIMIT) => {
  const result = [];
  const queue = [...items];
  while (queue.length && result.length < limit) {
    const last = result[result.length - 1];
    const lastCategory = normalizeToArray(last?.category)[0] || null;
    const idx = queue.findIndex((item) => {
      const currentCategory = normalizeToArray(item?.category)[0] || null;
      return !lastCategory || !currentCategory || currentCategory !== lastCategory;
    });
    result.push(idx === -1 ? queue.shift() : queue.splice(idx, 1)[0]);
  }
  return result;
};

const buildColdStartRecommendations = (movies = [], popularMovieScores = null, limit = RECOMMENDED_LIMIT) => {
  const scored = [...movies]
    .map((movie) => {
      const quality = getQualityScore(movie) * 0.75;
      const popularity = getPopularityBoost(movie, popularMovieScores) * 0.25;
      return { movie, score: quality + popularity };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.movie);

  return diversify(uniqueRecommendations(scored), limit);
};

const buildPersonalizedRecommendations = ({
  movies = [],
  user = null,
  limit = RECOMMENDED_LIMIT,
  popularMovieScores = null,
} = {}) => {
  const visibleMovies = movies.filter((movie) => normalizeText(movie?.category) !== "anonslar");
  if (!user) {
    return buildColdStartRecommendations(visibleMovies, popularMovieScores, limit);
  }

  const profile = buildSignalProfile(visibleMovies, user);
  const baseCandidates = visibleMovies.filter((movie) => !profile.viewedIds.has(Number(movie?.id)));
  const candidates = baseCandidates.length ? baseCandidates : visibleMovies;

  if (!profile.hasSignals) {
    return buildColdStartRecommendations(candidates, popularMovieScores, limit);
  }

  const scored = candidates
    .map((movie) => ({ movie, score: scoreMovie(movie, profile, null) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.movie);

  return diversify(uniqueRecommendations(scored), limit);
};

module.exports = {
  buildPersonalizedRecommendations,
  uniqueRecommendations,
  RECOMMENDED_LIMIT,
};
