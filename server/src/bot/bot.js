const dotenv = require("dotenv");
const TelegramBot = require("node-telegram-bot-api");
const { messageHandler } = require("./handlers/messageHandler");
const {
  callbackHandler,
  sendLanguageSelector,
} = require("./handlers/callbackHandlers");

dotenv.config();

const token = process.env.BOT_TOKEN;

let bot = null;

if (!token) {
  console.warn("BOT_TOKEN topilmadi. Telegram bot ishga tushmadi.");
} else {
  bot = new TelegramBot(token, { polling: true });
  bot.onText(/^\/start$/, async (msg) => {
    await sendLanguageSelector(bot, msg.chat.id);
  });
  bot.on("callback_query", async (query) => {
    await callbackHandler(bot, query);
  });
  bot.on("message", async (msg) => {
    if ((msg?.text || "").trim() === "/start") {
      return;
    }

    await messageHandler(bot, msg);
  });
  console.log("Telegram bot ishga tushdi.");
}

module.exports = bot;
