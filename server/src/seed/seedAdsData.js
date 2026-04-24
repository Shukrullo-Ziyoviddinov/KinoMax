require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Ads = require("../models/ads");

const adsData = [
  {
    adId: 1,
    videoUrl: "/video/rumovie.mp4",
    isActive: true,
    sortOrder: 1,
  },
];

const seedAdsData = async () => {
  try {
    await connectDB();
    await Ads.deleteMany();
    await Ads.insertMany(adsData);
    console.log("Ads data seed qilindi.");
  } catch (error) {
    console.error("Ads seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdsData();
