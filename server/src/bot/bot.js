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
const WEB_APP_URL = "https://kino-max-seven.vercel.app/";
const configuredMenuChats = new Set();

let bot = null;

if (!token) {
  console.warn("BOT_TOKEN topilmadi. Telegram bot ishga tushmadi.");
} else {
  bot = new TelegramBot(token, { polling: true });
  const baseUrl = WEB_APP_URL.endsWith("/") ? WEB_APP_URL.slice(0, -1) : WEB_APP_URL;
  const menuButton = {
    type: "web_app",
    text: "KinoMax",
    web_app: { url: baseUrl },
  };
  const setMenuButton = async (chatId = null) => {
    try {
      const payload = chatId
        ? { chat_id: chatId, menu_button: menuButton }
        : { menu_button: menuButton };
      await bot.setChatMenuButton(payload);
      if (chatId) configuredMenuChats.add(chatId);
    } catch (error) {
      console.error("Menu button sozlashda xatolik:", error?.response?.body || error?.message || error);
    }
  };
  setMenuButton();
  bot.on("polling_error", (error) => {
    console.error("Polling xatoligi:", error?.message || error);
  });
  bot.on("webhook_error", (error) => {
    console.error("Webhook xatoligi:", error?.message || error);
  });

  bot.onText(/^\/start$/, async (msg) => {
    try {
      if (msg?.chat?.id) {
        await setMenuButton(msg.chat.id);
      }
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
      const chatId = msg?.chat?.id;
      if (chatId && !configuredMenuChats.has(chatId)) {
        await setMenuButton(chatId);
      }
      await messageHandler(bot, msg);
    } catch (error) {
      console.error("message handler xatoligi:", error?.message || error);
    }
  });
  console.log("Telegram bot ishga tushdi.");
}

module.exports = bot;
