const { getAllMovies } = require("../../services/movieService");
const { getUserLanguage } = require("../../utils/userState");
const { normalizeLanguage } = require("../../utils/i18n");

const WEB_APP_URL = "https://kino-max-seven.vercel.app/";

function resolveLanguage(query) {
  const savedLanguage = getUserLanguage(query?.from?.id);
  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }

  const telegramLanguage = query?.from?.language_code || "";
  return telegramLanguage.toLowerCase().startsWith("ru") ? "ru" : "uz";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function buildMovieSummary(movie, language) {
  const details =
    movie?.description?.[language] || movie?.description?.uz || movie?.description?.ru || {};
  const genres =
    details?.genre ||
    movie?.genre?.[language] ||
    movie?.genre?.uz ||
    movie?.genre?.ru ||
    [];
  const genreText = Array.isArray(genres) && genres.length ? genres.join(", ") : "-";
  const year = details?.year ?? "-";
  const country = details?.country || "-";
  const duration = details?.duration ?? "-";
  const durationUnit = language === "ru" ? "мин" : "daq";

  return `${genreText} • ${year} • ${country} • ${duration} ${durationUnit}`;
}

function toAbsoluteAssetUrl(assetPath) {
  if (!assetPath || typeof assetPath !== "string") {
    return null;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const base = WEB_APP_URL.endsWith("/") ? WEB_APP_URL.slice(0, -1) : WEB_APP_URL;
  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${base}${normalizedPath}`;
}

function filterMovies(movies, queryText, language) {
  const needle = normalize(queryText);
  if (!needle) {
    return movies;
  }

  return movies.filter((movie) => {
    const title = movie?.title?.[language] || movie?.title?.uz || movie?.title?.ru || "";
    const details =
      movie?.description?.[language] || movie?.description?.uz || movie?.description?.ru || {};
    const genres = details?.genre || movie?.genre?.[language] || [];

    const haystack = [
      title,
      movie?.movieCode,
      details?.country,
      details?.year,
      details?.duration,
      Array.isArray(genres) ? genres.join(" ") : genres,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

function mapInlineResult(movie, language) {
  const title = movie?.title?.[language] || movie?.title?.uz || movie?.title?.ru || "Untitled";
  const thumbnail =
    movie?.homeImg?.[language] || movie?.homeImg?.uz || movie?.homeImg?.ru || null;
  const thumbnailUrl = toAbsoluteAssetUrl(thumbnail);

  const result = {
    type: "article",
    id: `${movie.id || movie.movieCode}-${language}`,
    title,
    description: buildMovieSummary(movie, language),
    input_message_content: {
      message_text: String(movie.movieCode),
    },
  };

  if (thumbnailUrl) {
    result.thumbnail_url = thumbnailUrl;
  }

  return result;
}

async function inlineQueryHandler(bot, query) {
  const language = resolveLanguage(query);
  const queryText = query?.query || "";
  const movies = getAllMovies();
  const filtered = filterMovies(movies, queryText, language).slice(0, 50);
  const results = filtered.map((movie) => mapInlineResult(movie, language));

  await bot.answerInlineQuery(query.id, results, {
    cache_time: 0,
    is_personal: true,
    button: {
      text: language === "ru" ? "Открыть поиск в приложении" : "Ilovada qidiruvni ochish",
      web_app: {
        url: `${WEB_APP_URL}?openSearch=1&source=telegram`,
      },
    },
  });
}

module.exports = {
  inlineQueryHandler,
};
