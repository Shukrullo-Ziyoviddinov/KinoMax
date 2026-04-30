require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Translation = require("../models/translation");

const UZ_PATH = path.resolve(__dirname, "../../..", "client/src/locales/uz/translation.json");
const RU_PATH = path.resolve(__dirname, "../../..", "client/src/locales/ru/translation.json");

function flatten(obj, prefix = "", out = {}) {
  Object.entries(obj || {}).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, nextKey, out);
      return;
    }
    out[nextKey] = value == null ? "" : String(value);
  });
  return out;
}

async function seedTranslations() {
  try {
    const uzJson = require(UZ_PATH);
    const ruJson = require(RU_PATH);
    const uzFlat = flatten(uzJson);
    const ruFlat = flatten(ruJson);
    const keys = [...new Set([...Object.keys(uzFlat), ...Object.keys(ruFlat)])].sort();

    const docs = keys.map((key) => ({
      namespace: "common",
      key,
      uz: uzFlat[key] || "",
      ru: ruFlat[key] || "",
      isActive: true,
    }));

    await connectDB();
    await Translation.deleteMany({ namespace: "common" });
    await Translation.insertMany(docs);

    console.log(`Tarjimalar seed qilindi. Jami: ${docs.length} ta key.`);
  } catch (error) {
    console.error("Translations seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedTranslations();
