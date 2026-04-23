require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Actor = require("../models/actors");

const actors = [
  {
    id: 1,
    name: { uz: "Leonardo DiCaprio", ru: "Леонардо ДиКаприо" },
    image: "/img/leanordo.jpg",
    info: {
      uz: "Amerikalik aktyor va produser. Inception, Titanic, The Revenant kabi filmlarda rol o'ynagan.",
      ru: "Американский актёр и продюсер. Снимался в фильмах Начало, Титаник, Выживший.",
    },
  },
  {
    id: 2,
    name: { uz: "Tobey Maguire", ru: "Тоби Магуайр" },
    image: "/img/toby.jpg",
    info: {
      uz: "Amerikalik aktyor. Spider-Man trilogiyasida Peter Parker rolini ijro etgan.",
      ru: "Американский актёр. Исполнил роль Питера Паркера в трилогии Человек-паук.",
    },
  },
  {
    id: 3,
    name: { uz: "Katrina Kaif", ru: "Катрина Кайф" },
    image: "/img/katrinas.jpg",
    info: {
      uz: "Hindiston-Britaniya aktrisasi. Bollywood filmlarida suratga tushgan.",
      ru: "Индийско-британская актриса. Снималась в фильмах Болливуда.",
    },
  },
  {
    id: 4,
    name: { uz: "Leonardo DiCaprio", ru: "Леонардо ДиКаприо" },
    image: "/img/leanordo.jpg",
    info: {
      uz: "Amerikalik aktyor va produser. Inception, Titanic, The Revenant kabi filmlarda rol o'ynagan.",
      ru: "Американский актёр и продюсер. Снимался в фильмах Начало, Титаник, Выживший.",
    },
  },
  {
    id: 5,
    name: { uz: "Tobey Maguire", ru: "Тоби Магуайр" },
    image: "/img/toby.jpg",
    info: {
      uz: "Amerikalik aktyor. Spider-Man trilogiyasida Peter Parker rolini ijro etgan.",
      ru: "Американский актёр. Исполнил роль Питера Паркера в трилогии Человек-паук.",
    },
  },
  {
    id: 6,
    name: { uz: "Katrina Kaif", ru: "Катрина Кайф" },
    image: "/img/katrinas.jpg",
    info: {
      uz: "Hindiston-Britaniya aktrisasi. Bollywood filmlarida suratga tushgan.",
      ru: "Индийско-британская актриса. Снималась в фильмах Болливуда.",
    },
  },
];

const actorSeedData = actors.map((actor) => ({
  actorId: actor.id,
  name: actor.name,
  image: actor.image,
  info: actor.info,
  isActive: true,
}));

const seedActors = async () => {
  try {
    await connectDB();
    await Actor.deleteMany();
    await Actor.insertMany(actorSeedData);
    console.log("Actorlar seed qilindi.");
  } catch (error) {
    console.error("Actors seed xatoligi:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedActors();
