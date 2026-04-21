const fs = require("fs");
const { getMovieByCode } = require("../../services/movieService");
const { getUserLanguage, setUserLanguage } = require("../../utils/userState");
const { normalizeLanguage, t } = require("../../utils/i18n");
const {
  buildCaption,
  buildMovieInlineKeyboard,
  resolveVideoSource,
  sendVideoWithCache,
} = require("./messageHandler");

const LANGUAGE_CALLBACK_PREFIX = "set_lang:";
const TELEGRAM_WATCH_CALLBACK_PREFIX = "watch_telegram:";

function buildWatchSources(movie, language) {
  const fallbackLanguage = language === "ru" ? "uz" : "ru";
  const candidates = [
    movie?.watchVideo?.[language],
    movie?.watchVideo?.[fallbackLanguage],
    movie?.movieMedia?.[language]?.video?.src,
    movie?.movieMedia?.[fallbackLanguage]?.video?.src,
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function buildLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🇺🇿 UZ", callback_data: `${LANGUAGE_CALLBACK_PREFIX}uz` },
        { text: "🇷🇺 RU", callback_data: `${LANGUAGE_CALLBACK_PREFIX}ru` },
      ],
    ],
  };
}

async function sendLanguageSelector(bot, chatId) {
  await bot.sendMessage(chatId, t("uz", "chooseLanguage"), {
    reply_markup: buildLanguageKeyboard(),
  });
}

async function clearLanguageSelectorMessage(bot, query) {
  const chatId = query?.message?.chat?.id;
  const messageId = query?.message?.message_id;

  if (!chatId || typeof messageId !== "number") {
    return;
  }

  try {
    await bot.deleteMessage(chatId, messageId);
    return;
  } catch (error) {
    console.warn("Til tanlash xabarini o'chirib bo'lmadi:", error.message);
  }

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: messageId }
    );
  } catch (error) {
    console.warn("Til tanlash tugmalarini o'chirib bo'lmadi:", error.message);
  }
}

async function callbackHandler(bot, query) {
  const callbackData = query?.data || "";
  const userId = query?.from?.id;
  const chatId = query?.message?.chat?.id;

  if (callbackData.startsWith(TELEGRAM_WATCH_CALLBACK_PREFIX)) {
    const selectedLanguage = getUserLanguage(userId);
    const language = normalizeLanguage(selectedLanguage);
    const codeValue = callbackData.replace(TELEGRAM_WATCH_CALLBACK_PREFIX, "");
    const movieCode = Number(codeValue);
    const movie = Number.isNaN(movieCode) ? null : getMovieByCode(movieCode);

    await bot.answerCallbackQuery(query.id, {
      text:
        language === "ru"
          ? "Видео отправляется в Telegram..."
          : "Video Telegram orqali yuborilmoqda...",
    });

    if (!chatId || !movie) {
      if (chatId) {
        await bot.sendMessage(chatId, t(language, "movieNotFound", codeValue));
      }
      return;
    }

    const videoSources = buildWatchSources(movie, language);
    const caption = buildCaption(movie, language);
    const keyboard = buildMovieInlineKeyboard(movie, language);

    for (const src of videoSources) {
      const source = resolveVideoSource(src);
      if (!source) {
        continue;
      }

      try {
        await sendVideoWithCache(bot, chatId, source.publicUrl, source.cacheKey, caption, {
          reply_markup: keyboard,
        });
        return;
      } catch (error) {
        if (!source.localPath || !fs.existsSync(source.localPath)) {
          continue;
        }

        try {
          await sendVideoWithCache(
            bot,
            chatId,
            source.localPath,
            source.cacheKey,
            caption,
            { reply_markup: keyboard }
          );
          return;
        } catch (localError) {
          continue;
        }
      }
    }

    await bot.sendMessage(chatId, t(language, "videoNotFound"));
    return;
  }

  if (!callbackData.startsWith(LANGUAGE_CALLBACK_PREFIX)) {
    return;
  }

  const selected = callbackData.replace(LANGUAGE_CALLBACK_PREFIX, "");
  const language = normalizeLanguage(selected);
  setUserLanguage(userId, language);

  await bot.answerCallbackQuery(query.id, {
    text: t(language, "languageSaved"),
  });

  if (chatId) {
    await clearLanguageSelectorMessage(bot, query);
    await bot.sendMessage(chatId, t(language, "askCode"));
  }
}

module.exports = {
  callbackHandler,
  sendLanguageSelector,
};
