const { getWebAppUrl } = require("../webAppUrl");

function buildSearchActionsKeyboard(language) {
  const isRu = language === "ru";
  const baseUrl = getWebAppUrl();
  const searchUrl = `${baseUrl}/?openSearch=1&source=telegram`;

  return {
    inline_keyboard: [
      [
        {
          text: isRu ? "🤖 Поиск через бота" : "🤖 Bot orqali qidirish",
          // Bo'sh query: @botusername + inline rejim. Space ba'zi klientlarda ishlamaydi.
          switch_inline_query_current_chat: "",
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
};
