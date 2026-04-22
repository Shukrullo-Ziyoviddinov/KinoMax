const translations = {
  uz: {
    chooseLanguage:
      "Bot tilini tanlash uchun qo'yidagilardan birini tanlang.\n\nВыберите один из вариантов ниже, чтобы выбрать язык бота.",
    askCode:
      "🎬 Kino kodini kiriting...\n🍿 Sevimli filmingizni topish uchun uning maxsus kodini yuboring.\n💡 Masalan: 100 yoki 55\n━━━━━━━━━━━━━━\n🔎 Qidiruv tizimi 24/7 faol",
    askCodeNumber: "Kod raqam ko'rinishida yuborilsin. Masalan: 100",
    statusSteps: [
      "🔎 Kod qabul qilindi",
      "🗂 Bazadan qidirilmoqda",
      "✅ Film topildi",
      "📤 Video yuborilmoqda",
      "🎉 Yuborildi",
    ],
    movieNotFound: (code) => `${code} raqamiga mos kino topilmadi.`,
    videoNotFound: "Video topilmadi.",
    sendError: "Kinoni yuborishda xatolik yuz berdi. Keyinroq urinib ko'ring.",
    languageSaved: "O'zbek tili tanlandi.",
    menuPrompt:
      "Botdan foydalanish uchun qo'yidagilardan birini tanlang va o'zingizga kerakli kinoni qidiring.",
    searchPrompt: "Filterlash uchun kerakli tugmani tanlang.",
  },
  ru: {
    chooseLanguage:
      "Bot tilini tanlash uchun qo'yidagilardan birini tanlang.\n\nВыберите один из вариантов ниже, чтобы выбрать язык бота.",
    askCode:
      "🎬 Введите код фильма...\n🍿 Чтобы найти любимый фильм, отправьте его специальный код.\n💡 Например: 100 или 55\n━━━━━━━━━━━━━━\n🔎 Поиск работает 24/7",
    askCodeNumber: "Код должен быть числом. Например: 100",
    statusSteps: [
      "🔎 Код получен",
      "🗂 Поиск в базе",
      "✅ Фильм найден",
      "📤 Отправка видео",
      "🎉 Отправлено",
    ],
    movieNotFound: (code) => `Фильм по коду ${code} не найден.`,
    videoNotFound: "Видео не найдено.",
    sendError:
      "Произошла ошибка при отправке фильма. Попробуйте еще раз позже.",
    languageSaved: "Выбран русский язык.",
    menuPrompt:
      "Чтобы пользоваться ботом, выберите один из пунктов ниже и найдите нужный фильм.",
    searchPrompt: "Выберите нужную кнопку для фильтрации.",
  },
};

function normalizeLanguage(language) {
  return language === "ru" ? "ru" : "uz";
}

function t(language, key, ...args) {
  const lang = normalizeLanguage(language);
  const value = translations[lang]?.[key];

  if (typeof value === "function") {
    return value(...args);
  }

  return value || "";
}

module.exports = {
  t,
  normalizeLanguage,
};
