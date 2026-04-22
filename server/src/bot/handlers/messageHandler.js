const fs = require("fs");
const path = require("path");
const { getMovieByCode } = require("../../services/movieService");
const { getUserLanguage } = require("../../utils/userState");
const { normalizeLanguage, t } = require("../../utils/i18n");

const clientPublicPath = path.resolve(__dirname, "../../../../client/public");
const telegramVideoCache = new Map();
const STATUS_DONE_DELAY_MS = 600;
const DESCRIPTION_MAX_LINES = 5;
const DESCRIPTION_APPROX_LINE_WIDTH = 36;
const DESCRIPTION_PREVIEW_MAX_CHARS =
  DESCRIPTION_MAX_LINES * DESCRIPTION_APPROX_LINE_WIDTH;
const WEB_APP_URL = "https://kino-max-seven.vercel.app/";
const SHARE_BASE_URL = "https://t.me/share/url";

function truncateTextToPreview(text, maxChars) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const slice = normalized.slice(0, maxChars);
  const lastSpaceIndex = slice.lastIndexOf(" ");
  const cutIndex = lastSpaceIndex > maxChars * 0.65 ? lastSpaceIndex : maxChars;
  return `${normalized.slice(0, cutIndex).trimEnd()}...`;
}

function buildCaption(movie, language) {
  const lang = normalizeLanguage(language);
  const title = movie?.title?.[lang] || movie?.title?.uz || movie?.title?.ru || "";
  const localizedDetails =
    movie?.description?.[lang] || movie?.description?.uz || movie?.description?.ru || {};
  const description = truncateTextToPreview(
    localizedDetails?.text || "",
    DESCRIPTION_PREVIEW_MAX_CHARS
  );
  const year = localizedDetails?.year ?? "-";
  const country = localizedDetails?.country || "-";
  const duration = localizedDetails?.duration ?? "-";
  const genres =
    localizedDetails?.genre ||
    movie?.genre?.[lang] ||
    movie?.genre?.uz ||
    movie?.genre?.ru ||
    [];
  const genreText = Array.isArray(genres) && genres.length ? genres.join(", ") : "-";
  const yearLabel = lang === "ru" ? "Год" : "Yil";
  const countryLabel = lang === "ru" ? "Страна" : "Davlat";
  const durationLabel = lang === "ru" ? "Длительность" : "Daqiqa";
  const genreLabel = lang === "ru" ? "Жанр" : "Janr";
  const durationUnit = lang === "ru" ? "мин" : "daqiqa";
  const durationText = duration === "-" ? "-" : `${duration} ${durationUnit}`;

  return [
    title,
    description,
    `📅 ${yearLabel}: ${year}`,
    `🌍 ${countryLabel}: ${country}`,
    `⏱️ ${durationLabel}: ${durationText}`,
    `🎭 ${genreLabel}: ${genreText}`,
    `Rating: ${movie.rating ?? "-"}`,
    `IMDb: ${movie.ratingImdb ?? "-"}`,
    `Kinopoisk: ${movie.ratingKinopoisk ?? "-"}`,
    `Netflix: ${movie.ratingNetflix ?? "-"}`,
  ].join("\n");
}

const SHARE_TEXT_MAX_CHARS = 3800;

function buildShareText(movie, language, movieTargetUrl) {
  const lang = normalizeLanguage(language);
  const title = movie?.title?.[lang] || movie?.title?.uz || movie?.title?.ru || "";
  const localizedDetails =
    movie?.description?.[lang] || movie?.description?.uz || movie?.description?.ru || {};
  const fullDescription = (localizedDetails?.text || "")
    .replace(/\s+/g, " ")
    .trim();
  const year = localizedDetails?.year ?? "-";
  const country = localizedDetails?.country || "-";
  const duration = localizedDetails?.duration ?? "-";
  const genres =
    localizedDetails?.genre ||
    movie?.genre?.[lang] ||
    movie?.genre?.uz ||
    movie?.genre?.ru ||
    [];
  const genreText = Array.isArray(genres) && genres.length ? genres.join(", ") : "-";
  const yearLabel = lang === "ru" ? "Год" : "Yil";
  const countryLabel = lang === "ru" ? "Страна" : "Davlat";
  const durationLabel = lang === "ru" ? "Длительность" : "Daqiqa";
  const genreLabel = lang === "ru" ? "Жанр" : "Janr";
  const durationUnit = lang === "ru" ? "мин" : "daqiqa";
  const durationText = duration === "-" ? "-" : `${duration} ${durationUnit}`;

  const lines = [
    title,
    fullDescription,
    `📅 ${yearLabel}: ${year}`,
    `🌍 ${countryLabel}: ${country}`,
    `⏱️ ${durationLabel}: ${durationText}`,
    `🎭 ${genreLabel}: ${genreText}`,
    `Rating: ${movie.rating ?? "-"}`,
    `IMDb: ${movie.ratingImdb ?? "-"}`,
    `Kinopoisk: ${movie.ratingKinopoisk ?? "-"}`,
    `Netflix: ${movie.ratingNetflix ?? "-"}`,
  ];

  const fallbackLang = lang === "ru" ? "uz" : "ru";
  const watchSrc =
    movie?.watchVideo?.[lang] ||
    movie?.watchVideo?.[fallbackLang];
  if (watchSrc) {
    const source = resolveVideoSource(watchSrc);
    if (source?.publicUrl) {
      lines.push(
        lang === "ru"
          ? `🎥 Видео: ${source.publicUrl}`
          : `🎥 Video: ${source.publicUrl}`
      );
    }
  }

  lines.push(
    lang === "ru"
      ? `🔗 Смотреть на сайте: ${movieTargetUrl}`
      : `🔗 Tomosha: ${movieTargetUrl}`
  );

  let text = lines.filter(Boolean).join("\n");
  if (text.length > SHARE_TEXT_MAX_CHARS) {
    text = `${text.slice(0, SHARE_TEXT_MAX_CHARS - 3)}...`;
  }
  return text;
}

function buildMovieInlineKeyboard(movie, language) {
  const movieCode = movie?.movieCode;
  const movieId = movie?.id;
  const websiteBase = WEB_APP_URL.endsWith("/")
    ? WEB_APP_URL.slice(0, -1)
    : WEB_APP_URL;
  const movieTargetUrl = movieId
    ? `${websiteBase}/movie/${movieId}`
    : `${websiteBase}?code=${movieCode}`;
  const shareTarget = movieTargetUrl;
  const shareText = buildShareText(movie, language, movieTargetUrl);
  const shareUrl = `${SHARE_BASE_URL}?url=${encodeURIComponent(
    shareTarget
  )}&text=${encodeURIComponent(shareText)}`;

  return {
    inline_keyboard: [
      [
        {
          text: language === "ru" ? "🎬 Смотреть" : "🎬 Tomosha qilish",
          web_app: { url: movieTargetUrl },
        },
      ],
      [
        {
          text: language === "ru" ? "📤 Поделиться" : "📤 Yuborish",
          url: shareUrl,
        },
      ],
    ],
  };
}

function resolveVideoPath(videoSrc) {
  if (!videoSrc || typeof videoSrc !== "string") {
    return null;
  }

  const normalized = videoSrc.startsWith("/") ? videoSrc.slice(1) : videoSrc;
  return path.join(clientPublicPath, normalized);
}

function resolveVideoSource(videoSrc) {
  if (!videoSrc || typeof videoSrc !== "string") {
    return null;
  }

  if (/^https?:\/\//i.test(videoSrc)) {
    return {
      cacheKey: videoSrc,
      localPath: null,
      publicUrl: videoSrc,
    };
  }

  const normalized = videoSrc.startsWith("/") ? videoSrc : `/${videoSrc}`;
  const websiteBase = WEB_APP_URL.endsWith("/")
    ? WEB_APP_URL.slice(0, -1)
    : WEB_APP_URL;

  return {
    cacheKey: normalized,
    localPath: resolveVideoPath(normalized),
    publicUrl: `${websiteBase}${normalized}`,
  };
}

function getCurrentLanguage(msg) {
  const savedLanguage = getUserLanguage(msg?.from?.id);
  if (savedLanguage) {
    return normalizeLanguage(savedLanguage);
  }

  const telegramLanguage = msg?.from?.language_code || "";
  return telegramLanguage.toLowerCase().startsWith("ru") ? "ru" : "uz";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStatusMessage(language, code, currentStep) {
  const steps = t(language, "statusSteps");
  if (!Array.isArray(steps) || steps.length === 0) {
    return `📥 Kod: ${code}`;
  }

  const endIndex = Math.min(currentStep + 1, steps.length);
  const visibleSteps = steps.slice(0, endIndex);
  return [`📥 Kod: ${code}`, "━━━━━━━━━━━━━━", ...visibleSteps].join("\n");
}

async function createStatusTracker(bot, chatId, language, code) {
  let messageId = null;

  try {
    const sent = await bot.sendMessage(
      chatId,
      buildStatusMessage(language, code, 0)
    );
    messageId = sent?.message_id || null;
  } catch (error) {
    return null;
  }

  const update = async (stepIndex) => {
    if (!messageId) {
      return;
    }

    try {
      await bot.editMessageText(buildStatusMessage(language, code, stepIndex), {
        chat_id: chatId,
        message_id: messageId,
      });
    } catch (error) {
      // Xabar o'zgartirib bo'lmasa ham asosiy oqimni to'xtatmaymiz.
    }
  };

  return {
    update,
    remove: async () => {
      if (!messageId) {
        return;
      }

      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        // Xabar allaqachon o'chgan bo'lishi mumkin.
      }
    },
  };
}

async function sendVideoWithCache(
  bot,
  chatId,
  videoInput,
  cacheKey,
  caption,
  options = {}
) {
  const videoOptions = { ...options };
  if (caption != null && caption !== "") {
    videoOptions.caption = caption;
  }

  const cachedFileId = telegramVideoCache.get(cacheKey);
  if (cachedFileId) {
    await bot.sendVideo(chatId, cachedFileId, videoOptions);
    return;
  }

  const sentMessage = await bot.sendVideo(chatId, videoInput, videoOptions);
  const fileId = sentMessage?.video?.file_id;
  if (fileId) {
    telegramVideoCache.set(cacheKey, fileId);
  }
}

/**
 * Telegramga video yuborishda avvalo mahalliy faylni ishlatamiz (tez va ishonchli).
 * URL orqali yuborishda Telegram serverlari uzoqdan katta faylni yuklab olishi kerak — juda sekin yoki muvaffaqiyatsiz bo‘lishi mumkin.
 */
async function sendVideoFromResolvedSource(bot, chatId, source, caption, options = {}) {
  if (!source) {
    return false;
  }

  if (source.localPath && fs.existsSync(source.localPath)) {
    try {
      await sendVideoWithCache(
        bot,
        chatId,
        source.localPath,
        source.cacheKey,
        caption,
        options
      );
      return true;
    } catch (localError) {
      console.warn("Mahalliy video yuborilmadi, URL sinanadi:", localError.message);
    }
  }

  try {
    await sendVideoWithCache(
      bot,
      chatId,
      source.publicUrl,
      source.cacheKey,
      caption,
      options
    );
    return true;
  } catch (urlError) {
    if (source.localPath && fs.existsSync(source.localPath)) {
      await sendVideoWithCache(
        bot,
        chatId,
        source.localPath,
        source.cacheKey,
        caption,
        options
      );
      return true;
    }
    throw urlError;
  }
}

async function sendMovieVideo(bot, chatId, movie, language) {
  const primarySrc = movie?.movieMedia?.[language]?.video?.src;
  const fallbackLanguage = language === "ru" ? "uz" : "ru";
  const fallbackSrc = movie?.movieMedia?.[fallbackLanguage]?.video?.src;

  const videoSrc = primarySrc || fallbackSrc;
  const source = resolveVideoSource(videoSrc);
  const caption = buildCaption(movie, language);
  const reply_markup = buildMovieInlineKeyboard(movie, language);

  if (!source) {
    await bot.sendMessage(chatId, `${caption}\n\n${t(language, "videoNotFound")}`);
    return;
  }

  await sendVideoFromResolvedSource(bot, chatId, source, caption, { reply_markup });
}

async function messageHandler(bot, msg) {
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();
  const language = getCurrentLanguage(msg);

  if (!chatId) {
    return;
  }

  if (!/^\d+$/.test(text)) {
    await bot.sendMessage(chatId, t(language, "askCodeNumber"));
    return;
  }

  const code = Number(text);
  const status = await createStatusTracker(bot, chatId, language, code);
  if (status) {
    await status.update(1);
  }

  const movie = getMovieByCode(code);

  if (!movie) {
    if (status) {
      await status.remove();
    }

    await bot.sendMessage(chatId, t(language, "movieNotFound", code));
    return;
  }

  try {
    if (status) {
      await status.update(2);
      await status.update(3);
    }

    await bot.sendChatAction(chatId, "upload_video");
    await sendMovieVideo(bot, chatId, movie, language);

    if (status) {
      await status.update(4);
      await sleep(STATUS_DONE_DELAY_MS);
      await status.remove();
    }
  } catch (error) {
    console.error("Xabarni qayta ishlashda xatolik:", error.message);
    if (status) {
      await status.remove();
    }
    await bot.sendMessage(chatId, t(language, "sendError"));
  }
}

module.exports = {
  messageHandler,
  buildCaption,
  buildMovieInlineKeyboard,
  clientPublicPath,
  resolveVideoSource,
  sendVideoWithCache,
  sendVideoFromResolvedSource,
  WEB_APP_URL,
};
