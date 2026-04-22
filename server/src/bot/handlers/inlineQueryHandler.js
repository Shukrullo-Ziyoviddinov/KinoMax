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

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function fuzzyMatch(queryWord, targetWord) {
  if (!queryWord || !targetWord || queryWord.length < 2) {
    return false;
  }

  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
    return true;
  }

  if (queryWord.length >= 3 && targetWord.length >= 3) {
    const distance = levenshtein(queryWord, targetWord);
    const maxDistance =
      queryWord.length <= 4 ? 1 : Math.min(2, Math.floor(queryWord.length / 2));
    return distance <= maxDistance;
  }

  return false;
}

function titleMatchScore(movie, q, queryWords) {
  const titleUz = normalize(movie?.title?.uz);
  const titleRu = normalize(movie?.title?.ru);

  if (titleUz.includes(q) || titleRu.includes(q)) {
    return 3;
  }

  const titleWords = `${titleUz} ${titleRu}`.split(/\s+/).filter(Boolean);
  for (const queryWord of queryWords) {
    if (queryWord.length < 2) {
      continue;
    }

    if (titleWords.some((word) => fuzzyMatch(queryWord, word))) {
      return 2;
    }
  }

  return 0;
}

function metaMatchScore(movie, language, queryWords) {
  const details =
    movie?.description?.[language] || movie?.description?.uz || movie?.description?.ru || {};
  const genres =
    details?.genre ||
    movie?.genre?.[language] ||
    movie?.genre?.uz ||
    movie?.genre?.ru ||
    [];

  const haystackItems = [
    movie?.movieCode,
    details?.country,
    details?.year,
    details?.duration,
    ...(Array.isArray(genres) ? genres : [genres]),
  ]
    .filter(Boolean)
    .map((item) => normalize(item));

  let hits = 0;
  for (const queryWord of queryWords) {
    if (queryWord.length < 2) {
      continue;
    }

    if (haystackItems.some((item) => fuzzyMatch(queryWord, item) || item.includes(queryWord))) {
      hits += 1;
    }
  }

  return hits > 0 ? 1 : 0;
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
  const durationUnit = language === "ru" ? "мин" : "daqiqa";

  return `${year} • ${country} • ${duration} ${durationUnit}\n${genreText}`;
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
  const onlySymbols = !/[a-zA-Z0-9\u0400-\u04FF\u0600-\u06FF]/.test(needle);
  if (!needle || needle === "*" || needle === "." || onlySymbols) {
    return movies;
  }

  const queryWords = needle.split(/\s+/).filter(Boolean);
  const scored = [];

  for (const movie of movies) {
    const titleScore = titleMatchScore(movie, needle, queryWords);
    const metaScore = metaMatchScore(movie, language, queryWords);
    const totalScore = titleScore + metaScore;

    if (totalScore > 0) {
      scored.push({ movie, totalScore });
    }
  }

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.map((item) => item.movie);
}

function mapInlineResult(movie, language) {
  const title = movie?.title?.[language] || movie?.title?.uz || movie?.title?.ru || "Untitled";
  const thumbnail =
    movie?.homeImg?.[language] || movie?.homeImg?.uz || movie?.homeImg?.ru || null;
  const thumbnailUrl = toAbsoluteAssetUrl(thumbnail);
  const details =
    movie?.description?.[language] || movie?.description?.uz || movie?.description?.ru || {};
  const movieId = movie?.id;
  const base = WEB_APP_URL.endsWith("/") ? WEB_APP_URL.slice(0, -1) : WEB_APP_URL;
  const movieUrl = movieId ? `${base}/movie/${movieId}` : `${base}/?code=${movie?.movieCode}`;
  const messageText = [title, buildMovieSummary(movie, language)].filter(Boolean).join("\n");

  const result = {
    type: "article",
    id: `${movie.id || movie.movieCode}-${language}`,
    title,
    description: buildMovieSummary(movie, language),
    url: movieUrl,
    hide_url: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: language === "ru" ? "🎬 Смотреть" : "🎬 Tomosha qilish",
            web_app: { url: movieUrl },
          },
        ],
      ],
    },
    input_message_content: {
      message_text: messageText,
    },
  };

  if (thumbnailUrl) {
    result.thumbnail_url = thumbnailUrl;
    // Telegram clientlarning ayrim versiyalari hali thumb_url ishlatadi.
    result.thumb_url = thumbnailUrl;
  }

  return result;
}

async function inlineQueryHandler(bot, query) {
  const language = resolveLanguage(query);
  const queryText = (query?.query || "").trim();
  const offset = Number.parseInt(query?.offset || "0", 10) || 0;
  const pageSize = 50;
  const movies = getAllMovies();
  const filtered = filterMovies(movies, queryText, language);
  const page = filtered.slice(offset, offset + pageSize);
  const results = page.map((movie) => mapInlineResult(movie, language));
  const nextOffset =
    offset + pageSize < filtered.length ? String(offset + pageSize) : "";

  try {
    await bot.answerInlineQuery(query.id, results, {
      cache_time: 0,
      is_personal: true,
      next_offset: nextOffset,
    });
  } catch (error) {
    console.error("Inline query javobida xatolik:", error.message);
    try {
      await bot.answerInlineQuery(query.id, [], {
        cache_time: 0,
        is_personal: true,
        next_offset: "",
      });
    } catch (fallbackError) {
      console.error("Inline query fallback xatoligi:", fallbackError.message);
    }
  }
}

module.exports = {
  inlineQueryHandler,
};
