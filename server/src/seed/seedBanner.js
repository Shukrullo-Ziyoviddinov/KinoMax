require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Banner = require("../models/banner");

const bannerImages = {
  uz: [
    { id: 111, movieId: 6005, image: "/img/movie3.jpg" },
    { id: 102, movieId: 5004, image: "/img/movie6.jpg" },
    { id: 103, movieId: 4008, image: "/img/movie12.jpg" },
    { id: 104, movieId: 4007, image: "/img/movie15.jpg" },
  ],
  ru: [
    { id: 101, movieId: 6005, image: "/img/movie3.jpg" },
    { id: 102, movieId: 5004, image: "/img/movie6.jpg" },
    { id: 103, movieId: 5008, image: "/img/movie12.jpg" },
    { id: 104, movieId: 4007, image: "/img/movie15.jpg" },
  ],
};

const bannerSeedData = Object.entries(bannerImages).flatMap(([lang, banners]) =>
  banners.map((item, index) => ({
    bannerId: item.id,
    movieId: item.movieId,
    image: item.image,
    lang,
    isActive: true,
    sortOrder: index + 1,
  }))
);

const seedBanners = async () => {
  try {
    await connectDB();
    await Banner.deleteMany();
    await Banner.insertMany(bannerSeedData);
    console.log("Bannerlar seed qilindi.");
  } catch (error) {
    console.error("Banner seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedBanners();
