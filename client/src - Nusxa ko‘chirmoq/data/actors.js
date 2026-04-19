export const actors = [
  {
    id: 1,
    name: { uz: "Leonardo DiCaprio", ru: "Леонардо ДиКаприо" },
    image: "/img/leanordo.jpg",
    info: {
      uz: "Amerikalik aktyor va produser. Inception, Titanic, The Revenant kabi filmlarda rol o'ynagan.",
      ru: "Американский актёр и продюсер. Снимался в фильмах Начало, Титаник, Выживший."
    }
  },
  {
    id: 2,
    name: { uz: "Tobey Maguire", ru: "Тоби Магуайр" },
    image: "/img/toby.jpg",
    info: {
      uz: "Amerikalik aktyor. Spider-Man trilogiyasida Peter Parker rolini ijro etgan.",
      ru: "Американский актёр. Исполнил роль Питера Паркера в трилогии Человек-паук."
    }
  },
  {
    id: 3,
    name: { uz: "Katrina Kaif", ru: "Катрина Кайф" },
    image: "/img/katrinas.jpg",
    info: {
      uz: "Hindiston-Britaniya aktrisasi. Bollywood filmlarida suratga tushgan.",
      ru: "Индийско-британская актриса. Снималась в фильмах Болливуда."
    }
  },
  
  {
    id: 4,
    name: { uz: "Leonardo DiCaprio", ru: "Леонардо ДиКаприо" },
    image: "/img/leanordo.jpg",
    info: {
      uz: "Amerikalik aktyor va produser. Inception, Titanic, The Revenant kabi filmlarda rol o'ynagan.",
      ru: "Американский актёр и продюсер. Снимался в фильмах Начало, Титаник, Выживший."
    }
  },
  {
    id: 5,
    name: { uz: "Tobey Maguire", ru: "Тоби Магуайр" },
    image: "/img/toby.jpg",
    info: {
      uz: "Amerikalik aktyor. Spider-Man trilogiyasida Peter Parker rolini ijro etgan.",
      ru: "Американский актёр. Исполнил роль Питера Паркера в трилогии Человек-паук."
    }
  },
  {
    id: 6,
    name: { uz: "Katrina Kaif", ru: "Катрина Кайф" },
    image: "/img/katrinas.jpg",
    info: {
      uz: "Hindiston-Britaniya aktrisasi. Bollywood filmlarida suratga tushgan.",
      ru: "Индийско-британская актриса. Снималась в фильмах Болливуда."
    }
  },
];

export const getActorsByIds = (ids = []) => {
  const idList = Array.isArray(ids) ? ids : [];
  const normalizedIds = idList.map(i => parseInt(i, 10)).filter(i => !isNaN(i));
  return actors.filter(a => normalizedIds.includes(a.id));
};

export const getActorById = (id) => {
  if (id == null) return undefined;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return undefined;
  return actors.find(a => a.id === numId);
};
