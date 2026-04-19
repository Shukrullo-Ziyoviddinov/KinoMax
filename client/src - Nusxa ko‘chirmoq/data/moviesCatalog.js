import movies from './movies.json';

const CATEGORY_NAME_TO_SECTION = {
  russianMovie: 'russianMovies',
  retroMovie: 'retroMovies',
  romanceMovie: 'romanceMovies',
  turkishMovie: 'turkishSeries',
  worldMovie: 'worldMovies',
  uzbekMovie: 'uzbekMovies',
  tvSeries: 'tvSeries',
  horrorMovie: 'horrorMovies',
  koreaDrama: 'koreaDrama',
  kinolar: 'kinolar',
  anime: 'anime',
  adventureMovie: 'adventureMovies',
  anons: 'anonslar',
  actionMovie: 'actionMovies',
  animation: 'animations',
  animationMovie: 'animations',
  multFilm: 'animations',
};

const resolveSectionKey = (movie) => {
  if (movie?.categoryName && CATEGORY_NAME_TO_SECTION[movie.categoryName]) {
    return CATEGORY_NAME_TO_SECTION[movie.categoryName];
  }
  return null;
};

export const allMovies = movies
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
    if (sectionKey === 'koreaDrama' && !nextTypeCategory.includes('korea')) {
      nextTypeCategory.push('korea');
    }

    return {
      ...movie,
      category: sectionKey,
      typeCategory: nextTypeCategory,
    };
  })
  .filter(Boolean);

const RECOMMENDED_LIMIT = 12;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const recommendationKey = (movie) => {
  const title =
    normalizeText(movie?.title?.uz) ||
    normalizeText(movie?.title?.ru) ||
    normalizeText(movie?.title);
  const year = normalizeText(movie?.description?.uz?.year || movie?.description?.ru?.year || movie?.specs?.year);
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

export const recommendedMovies = uniqueRecommendations(
  [...allMovies]
  .filter((movie) => movie.category !== 'anonslar')
  .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
).slice(0, RECOMMENDED_LIMIT);

const bySection = (sectionKey) => allMovies.filter((movie) => movie.category === sectionKey);

export const koreaDrama = bySection('koreaDrama');
export const kinolar = bySection('kinolar');
export const worldMovies = bySection('worldMovies');
export const animations = bySection('animations');
export const turkishSeries = bySection('turkishSeries');
export const russianMovies = bySection('russianMovies');
export const tvSeries = bySection('tvSeries');
export const actionMovies = bySection('actionMovies');
export const horrorMovies = bySection('horrorMovies');
export const anime = bySection('anime');
export const adventureMovies = bySection('adventureMovies');
export const romanceMovies = bySection('romanceMovies');
export const retroMovies = bySection('retroMovies');
export const uzbekMovies = bySection('uzbekMovies');
export const anonslar = bySection('anonslar');
