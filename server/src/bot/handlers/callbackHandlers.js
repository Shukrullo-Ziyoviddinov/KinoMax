const { setUserLanguage } = require("../../utils/userState");
const { normalizeLanguage, t } = require("../../utils/i18n");

const LANGUAGE_CALLBACK_PREFIX = "set_lang:";

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
