const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI .env faylda topilmadi.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB ga muvaffaqiyatli ulanildi.");
  } catch (error) {
    console.error("MongoDB ulanishida xatolik:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
