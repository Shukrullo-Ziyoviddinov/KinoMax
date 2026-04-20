const userLanguageMap = new Map();

function setUserLanguage(userId, language) {
  if (!userId || !language) {
    return;
  }

  userLanguageMap.set(String(userId), language);
}

function getUserLanguage(userId) {
  if (!userId) {
    return null;
  }

  return userLanguageMap.get(String(userId)) || null;
}

module.exports = {
  setUserLanguage,
  getUserLanguage,
};