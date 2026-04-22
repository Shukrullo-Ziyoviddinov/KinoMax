const WEB_APP_URL = "https://kino-max-seven.vercel.app/";

function buildSearchActionsKeyboard(language) {
  const isRu = language === "ru";
  const baseUrl = WEB_APP_URL.endsWith("/")
    ? WEB_APP_URL.slice(0, -1)
    : WEB_APP_URL;
  const searchUrl = `${baseUrl}/?openSearch=1&source=telegram`;

  return {
    inline_keyboard: [
      [
        {
          text: isRu ? "🤖 Поиск через бота" : "🤖 Bot orqali qidirish",
          // Inline resultlar darhol ko'rinishi uchun boshlang'ich query beramiz.
          switch_inline_query_current_chat: ".",
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
