const { getWebAppUrl } = require("../webAppUrl");

const BOT_SEARCH_CALLBACK = "bot_search:start";
const BOT_SEARCH_PICK_PREFIX = "bot_search:pick:";

function buildSearchActionsKeyboard(language) {
  const isRu = language === "ru";
  const baseUrl = getWebAppUrl();
  const searchUrl = `${baseUrl}/?openSearch=1&source=telegram`;

  return {
    inline_keyboard: [
      [
        {
          text: isRu ? "🤖 Искать названием в боте" : "🤖 Botda nom bilan qidirish",
          callback_data: BOT_SEARCH_CALLBACK,
        },
      ],
      [
        {
          text: isRu ? "📱 Поиск через приложение" : "📱 Ilova orqali qidirish",
          web_app: { url: searchUrl },
        },
      ],
    ],
  };
}

module.exports = {
  buildSearchActionsKeyboard,
  BOT_SEARCH_CALLBACK,
  BOT_SEARCH_PICK_PREFIX,
};
