require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Movie = require("../models/movies");
const movies = require("../../../client/src/data/movies.json");

const runSeed = async () => {
  await connectDB();

  try {
    await Movie.collection.dropIndex("movieId_1");
  } catch (_error) {
    // Index bo'lmasa davom etamiz.
  }

  await Movie.deleteMany();
  const docs = movies.map((movie) => ({
    ...movie,
    movieId: movie.id,
  }));

  await Movie.insertMany(docs);
  console.log(`Movies seed qilindi. Jami: ${docs.length}`);
};

const runSeedAndExit = async () => {
  try {
    await runSeed();
  } catch (error) {
    console.error("Movies seed xatoligi:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
};

if (require.main === module) {
  runSeedAndExit();
}

module.exports = { runSeed };
 