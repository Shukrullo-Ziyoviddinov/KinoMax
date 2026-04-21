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
const TELEGRAM_WATCH_CALLBACK_PREFIX = "watch_telegram:";
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

function buildMovieInlineKeyboard(movie, language) {
  const movieCode = movie?.movieCode;
  const movieId = movie?.id;
  const shareTarget = movieId
    ? `${WEB_APP_URL}movie/${movieId}`
    : `${WEB_APP_URL}?code=${movieCode}`;
  const shareText =
    language === "ru"
      ? `Смотри фильм в Kino Max (${movieCode})`
      : `Kino Maxda filmni tomosha qiling (${movieCode})`;
  const shareUrl = `${SHARE_BASE_URL}?url=${encodeURIComponent(
    shareTarget
  )}&text=${encodeURIComponent(shareText)}`;

  return {
    inline_keyboard: [
      [
        {
          text:
            language === "ru"
              ? "📺 Смотреть в Telegram"
              : "📺 Telegram orqali tomosha",
          callback_data: `${TELEGRAM_WATCH_CALLBACK_PREFIX}${movieCode}`,
        },
        {
          text: language === "ru" ? "🌐 Смотреть онлайн" : "🌐 Online tomosha",
          web_app: { url: WEB_APP_URL },
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
  videoPath,
  videoSrc,
  caption,
  options = {}
) {
  const cachedFileId = telegramVideoCache.get(videoSrc);
  if (cachedFileId) {
    await bot.sendVideo(chatId, cachedFileId, { caption, ...options });
    return;
  }

  const sentMessage = await bot.sendVideo(chatId, videoPath, {
    caption,
    ...options,
  });
  const fileId = sentMessage?.video?.file_id;
  if (fileId) {
    telegramVideoCache.set(videoSrc, fileId);
  }
}

async function sendMovieVideo(bot, chatId, movie, language) {
  const primarySrc = movie?.movieMedia?.[language]?.video?.src;
  const fallbackLanguage = language === "ru" ? "uz" : "ru";
  const fallbackSrc = movie?.movieMedia?.[fallbackLanguage]?.video?.src;

  const videoSrc = primarySrc || fallbackSrc;
  const videoPath = resolveVideoPath(videoSrc);
  const caption = buildCaption(movie, language);
  const reply_markup = buildMovieInlineKeyboard(movie, language);

  if (videoPath && fs.existsSync(videoPath)) {
    await sendVideoWithCache(bot, chatId, videoPath, videoSrc, caption, {
      reply_markup,
    });
  } else {
    await bot.sendMessage(chatId, `${caption}\n\n${t(language, "videoNotFound")}`);
  }
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
  sendVideoWithCache,
};
