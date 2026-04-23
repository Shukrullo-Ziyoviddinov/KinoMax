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

const resolveSectionKey = (movie) => {
  if (movie?.categoryName && CATEGORY_NAME_TO_SECTION[movie.categoryName]) {
    return CATEGORY_NAME_TO_SECTION[movie.categoryName];
  }
  return null;
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const RECOMMENDED_LIMIT = 12;

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

const uniqueRecommendations = (items) => {
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

const buildMoviesCatalog = (movies) => {
  const allMovies = transformMovies(movies);
  const recommendedMovies = uniqueRecommendations(
    [...allMovies]
      .filter((movie) => movie.category !== "anonslar")
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
  ).slice(0, RECOMMENDED_LIMIT);

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
