const translations = {
  uz: {
    chooseLanguage:
      "Bot tilini tanlash uchun qo'yidagilardan birini tanlang.\n\nВыберите один из вариантов ниже, чтобы выбрать язык бота.",
    askCode: "Kino kodini yuboring. Masalan: 100",
    askCodeNumber: "Kod raqam ko'rinishida yuborilsin. Masalan: 100",
    movieNotFound: (code) => `${code} raqamiga mos kino topilmadi.`,
    videoNotFound: "Video topilmadi.",
    sendError: "Kinoni yuborishda xatolik yuz berdi. Keyinroq urinib ko'ring.",
    languageSaved: "O'zbek tili tanlandi. Endi kino kodini yuboring.",
  },
  ru: {
    chooseLanguage:
      "Bot tilini tanlash uchun qo'yidagilardan birini tanlang.\n\nВыберите один из вариантов ниже, чтобы выбрать язык бота.",
    askCode: "Отправьте код фильма. Например: 100",
    askCodeNumber: "Код должен быть числом. Например: 100",
    movieNotFound: (code) => `Фильм по коду ${code} не найден.`,
    videoNotFound: "Видео не найдено.",
    sendError:
      "Произошла ошибка при отправке фильма. Попробуйте еще раз позже.",
    languageSaved: "Выбран русский язык. Теперь отправьте код фильма.",
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
