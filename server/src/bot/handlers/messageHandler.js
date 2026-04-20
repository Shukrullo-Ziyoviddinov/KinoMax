const fs = require("fs");
const path = require("path");
const { getMovieByCode } = require("../../services/movieService");
const { getUserLanguage } = require("../../utils/userState");
const { normalizeLanguage, t } = require("../../utils/i18n");

const clientPublicPath = path.resolve(__dirname, "../../../../client/public");
const telegramVideoCache = new Map();

function buildCaption(movie, language) {
  const lang = normalizeLanguage(language);
  const title = movie?.title?.[lang] || movie?.title?.uz || movie?.title?.ru || "";
  const description =
    movie?.description?.[lang]?.text ||
    movie?.description?.uz?.text ||
    movie?.description?.ru?.text ||
    "";

  return [
    title,
    description,
    `Rating: ${movie.rating ?? "-"}`,
    `IMDb: ${movie.ratingImdb ?? "-"}`,
    `Kinopoisk: ${movie.ratingKinopoisk ?? "-"}`,
    `Netflix: ${movie.ratingNetflix ?? "-"}`,
  ].join("\n");
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

async function sendVideoWithCache(bot, chatId, videoPath, videoSrc, caption) {
  const cachedFileId = telegramVideoCache.get(videoSrc);
  if (cachedFileId) {
    await bot.sendVideo(chatId, cachedFileId, { caption });
    return;
  }

  const sentMessage = await bot.sendVideo(chatId, videoPath, { caption });
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

  if (videoPath && fs.existsSync(videoPath)) {
    await sendVideoWithCache(bot, chatId, videoPath, videoSrc, caption);
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
  const movie = getMovieByCode(code);

  if (!movie) {
    await bot.sendMessage(chatId, t(language, "movieNotFound", code));
    return;
  }

  try {
    await sendMovieVideo(bot, chatId, movie, language);
  } catch (error) {
    console.error("Xabarni qayta ishlashda xatolik:", error.message);
    await bot.sendMessage(chatId, t(language, "sendError"));
  }
}

module.exports = {
  messageHandler,
};
