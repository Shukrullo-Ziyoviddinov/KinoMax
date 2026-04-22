const BOT_LANGUAGE_BUTTON_UZ = "🌐 Bot tili";
const BOT_LANGUAGE_BUTTON_RU = "🌐 Язык бота";
const SEARCH_BUTTON_UZ = "🔎 Qidiruv";
const SEARCH_BUTTON_RU = "🔎 Поиск";

function buildMainReplyKeyboard(language) {
  const isRu = language === "ru";
  return {
    keyboard: [
      [{ text: isRu ? BOT_LANGUAGE_BUTTON_RU : BOT_LANGUAGE_BUTTON_UZ }],
      [{ text: isRu ? SEARCH_BUTTON_RU : SEARCH_BUTTON_UZ }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

function isLanguageButton(text = "") {
  return text === BOT_LANGUAGE_BUTTON_UZ || text === BOT_LANGUAGE_BUTTON_RU;
}

function isSearchButton(text = "") {
  return text === SEARCH_BUTTON_UZ || text === SEARCH_BUTTON_RU;
}

module.exports = {
  buildMainReplyKeyboard,
  isLanguageButton,
  isSearchButton,
};
