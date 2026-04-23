/**
 * Avvalgi nom bilan chaqirish uchun qoldirilgan.
 * Asosiy seed: npm run seed:movies (Movie kolleksiyasi)
 */
const mongoose = require("mongoose");
const { runSeed } = require("./seedMovies");

(async () => {
  try {
    await runSeed();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
})();
