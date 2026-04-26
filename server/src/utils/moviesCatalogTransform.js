const CATEGORY_NAME_TO_SECTION = {
  russianMovie: "russianMovies",
  retroMovie: "retroMovies",
  romanceMovie: "romanceMovies",
  turkishMovie: "turkishSeries",
  worldMovie: "worldMovies",
  uzbekMovie: "uzbekMovies",
  tvSeries: "tvSeries",
  horrorMovie: "horrorMovies",
  koreaDrama: "koreaDrama",
  kinolar: "kinolar",
  anime: "anime",
  adventureMovie: "adventureMovies",
  anons: "anonslar",
  actionMovie: "actionMovies",
  animation: "animations",
  animationMovie: "animations",
  multFilm: "animations",
};
const { buildPersonalizedRecommendations } = require("../services/recommendationService");

const resolveSectionKey = (movie) => {
  if (movie?.categoryName && CATEGORY_NAME_TO_SECTION[movie.categoryName]) {
    return CATEGORY_NAME_TO_SECTION[movie.categoryName];
  }
  return null;
};

const transformMovies = (movies) =>
  movies
    .map((movie) => {
      const sectionKey = resolveSectionKey(movie);
      if (!sectionKey) return null;

      const nextTypeCategory = Array.isArray(movie.typeCategory)
        ? [...movie.typeCategory]
        : movie.typeCategory
        ? [movie.typeCategory]
        : [];

      if (!nextTypeCategory.includes(sectionKey)) {
        nextTypeCategory.push(sectionKey);
      }
      if (sectionKey === "koreaDrama" && !nextTypeCategory.includes("korea")) {
        nextTypeCategory.push("korea");
      }

      return {
        ...movie,
        category: sectionKey,
        typeCategory: nextTypeCategory,
      };
    })
    .filter(Boolean);

const buildMoviesCatalog = (movies, { user = null, popularMovieScores = null } = {}) => {
  const allMovies = transformMovies(movies);
  const recommendedMovies = buildPersonalizedRecommendations({
    movies: allMovies,
    user,
    popularMovieScores,
  });

  const bySection = (sectionKey) =>
    allMovies.filter((movie) => movie.category === sectionKey);

  return {
    allMovies,
    recommendedMovies,
    sections: {
      koreaDrama: bySection("koreaDrama"),
      kinolar: bySection("kinolar"),
      worldMovies: bySection("worldMovies"),
      animations: bySection("animations"),
      turkishSeries: bySection("turkishSeries"),
      russianMovies: bySection("russianMovies"),
      tvSeries: bySection("tvSeries"),
      actionMovies: bySection("actionMovies"),
      horrorMovies: bySection("horrorMovies"),
      anime: bySection("anime"),
      adventureMovies: bySection("adventureMovies"),
      romanceMovies: bySection("romanceMovies"),
      retroMovies: bySection("retroMovies"),
      uzbekMovies: bySection("uzbekMovies"),
      anonslar: bySection("anonslar"),
    },
  };
};

module.exports = {
  CATEGORY_NAME_TO_SECTION,
  buildMoviesCatalog,
};
