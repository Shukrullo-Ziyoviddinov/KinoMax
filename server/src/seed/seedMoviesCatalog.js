require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MoviesCatalog = require("../models/moviesCatalog");
const movies = require("../../../client/src/data/movies.json");
const { buildMoviesCatalog } = require("../utils/moviesCatalogTransform");

const seedMoviesCatalog = async () => {
  try {
    await connectDB();
    const { allMovies } = buildMoviesCatalog(movies);

    try {
      await MoviesCatalog.collection.dropIndex("movieId_1");
    } catch (_error) {
      // Index bo'lmasa davom etamiz.
    }

    await MoviesCatalog.deleteMany();
    await MoviesCatalog.insertMany(
      allMovies.map((movie) => ({
        ...movie,
        movieId: movie.id,
      }))
    );

    console.log(`Movies catalog seed qilindi. Jami: ${allMovies.length}`);
  } catch (error) {
    console.error("Movies catalog seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedMoviesCatalog();
  