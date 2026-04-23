require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Genre = require("../models/genres");

const genres = [
  {
    id: "drama",
    title: { uz: "Drama", ru: "Драма" },
    img: "/img/movie-4.5-1.avif",
    filterGenre: "Drama",
  },
  {
    id: "oilaviy",
    title: { uz: "Oilaviy", ru: "Семейный" },
    img: "/img/movie-4.5-2.jpeg",
    filterGenre: "Oilaviy",
  },
  {
    id: "romantika",
    title: { uz: "Romantika", ru: "Романтика" },
    img: "/img/movie-4.5-3.jpg",
    filterGenre: ["Romantika", "Romantik"],
  },
  {
    id: "multfilim",
    title: { uz: "Multfilim", ru: "Мультфильм" },
    img: "/img/movie-4.5-4.webp",
    filterGenre: "Multfilim",
  },
  {
    id: "boevik",
    title: { uz: "Boevik", ru: "Боевик" },
    img: "/img/movie-4.5-5.jpg",
    filterGenre: "Jangari",
  },
  {
    id: "anime",
    title: { uz: "Anime", ru: "Аниме" },
    img: "/img/movie-4.5-6.avif",
    filterGenre: "Anime",
  },
  {
    id: "sarguzasht",
    title: { uz: "Sarguzasht", ru: "Приключения" },
    img: "/img/movie-4.5-7.jpg",
    filterGenre: "Sarguzasht",
  },
];

const genreSeedData = genres.map((genre, index) => ({
  genreId: genre.id,
  title: genre.title,
  img: genre.img,
  filterGenre: Array.isArray(genre.filterGenre)
    ? genre.filterGenre
    : [genre.filterGenre],
  isActive: true,
  sortOrder: index + 1,
}));

const seedGenres = async () => {
  try {
    await connectDB();
    await Genre.deleteMany();
    await Genre.insertMany(genreSeedData);
    console.log("Janrlar seed qilindi.");
  } catch (error) {
    console.error("Genres seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedGenres();
