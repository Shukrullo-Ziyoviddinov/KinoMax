const dotenv = require("dotenv");
const TelegramBot = require("node-telegram-bot-api");
const { messageHandler } = require("./handlers/messageHandler");
const {
  callbackHandler,
  sendLanguageSelector,
} = require("./handlers/callbackHandlers");
const { inlineQueryHandler } = require("./handlers/inlineQueryHandler");

dotenv.config();

const token = process.env.BOT_TOKEN;

let bot = null;

if (!token) {
  console.warn("BOT_TOKEN topilmadi. Telegram bot ishga tushmadi.");
} else {
  bot = new TelegramBot(token, { polling: true });
  bot.on("polling_error", (error) => {
    console.error("Polling xatoligi:", error?.message || error);
  });
  bot.on("webhook_error", (error) => {
    console.error("Webhook xatoligi:", error?.message || error);
  });

  bot.onText(/^\/start$/, async (msg) => {
    try {
      await sendLanguageSelector(bot, msg.chat.id);
    } catch (error) {
      console.error("/start handler xatoligi:", error?.message || error);
    }
  });
  bot.on("callback_query", async (query) => {
    try {
      await callbackHandler(bot, query);
    } catch (error) {
      console.error("callback_query handler xatoligi:", error?.message || error);
    }
  });
  bot.on("inline_query", async (query) => {
    try {
      await inlineQueryHandler(bot, query);
    } catch (error) {
      console.error("inline_query handler xatoligi:", error?.message || error);
    }
  });
  bot.on("message", async (msg) => {
    if ((msg?.text || "").trim() === "/start") {
      return;
    }

    try {
      await messageHandler(bot, msg);
    } catch (error) {
      console.error("message handler xatoligi:", error?.message || error);
    }
  });
  console.log("Telegram bot ishga tushdi.");
}

module.exports = bot;
