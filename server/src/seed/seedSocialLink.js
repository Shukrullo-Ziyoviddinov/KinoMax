require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const SocialLink = require("../models/socialLink");

const CONTACT_DATA = {
  telegram: {
    link: "https://t.me/violetmovie",
    label: "Telegram",
    icon: "/img/Telegram_logo.webp",
  },
  email: {
    address: "abdusalomovjovox@gmail.com",
    label: "Gmail",
  },
};

const SOCIAL_LINKS = {
  telegram: {
    link: "https://t.me/violetmovie",
    label: "Telegram",
    icon: "/img/Telegram_logo.webp",
  },
  instagram: {
    link: "https://instagram.com/violetmovie",
    label: "Instagram",
    icon: "/img/Instagram-logo.png",
  },
  youtube: {
    link: "https://youtube.com/@violetmovie",
    label: "YouTube",
    icon: "/img/youtube-logo.png",
  },
  tiktok: {
    link: "https://tiktok.com/@violetmovie",
    label: "TikTok",
    icon: "/img/tiktok-logo.png",
  },
};

const APP_STORE_LINKS = {
  android: {
    link: "https://play.google.com/store/apps/details?id=com.violetmovie",
    icon: "/img/google-playy.png",
  },
  ios: {
    link: "https://apps.apple.com/app/violet-movie/id123456789",
    icon: "/img/apsto2.png",
  },
};

const toDocs = (data, type) =>
  Object.entries(data).map(([key, value], idx) => ({
    type,
    key,
    link: value.link || "",
    label: value.label || "",
    icon: value.icon || "",
    address: value.address || "",
    isActive: true,
    sortOrder: idx + 1,
  }));

const seedSocialLinks = async () => {
  try {
    await connectDB();
    await SocialLink.deleteMany();
    const docs = [
      ...toDocs(CONTACT_DATA, "contact"),
      ...toDocs(SOCIAL_LINKS, "social"),
      ...toDocs(APP_STORE_LINKS, "appStore"),
    ];
    await SocialLink.insertMany(docs);
    console.log("Social linklar seed qilindi.");
  } catch (error) {
    console.error("Social link seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedSocialLinks();
