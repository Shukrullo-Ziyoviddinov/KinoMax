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
          // Telegram ba'zi klientlarda bo'sh string bilan query yubormaydi.
          // Bitta bo'sh joy inline qatorni ishga tushiradi, handler esa trim qilib hammasini qaytaradi.
          switch_inline_query_current_chat: " ",
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
