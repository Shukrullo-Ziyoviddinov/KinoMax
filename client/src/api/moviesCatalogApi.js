import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchMoviesCatalog = async () => {
  const res = await fetch(`${getBase()}/api/movies-catalog`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Kino katalogini olishda xatolik.");
  }

  const data = json.data || {};
  return {
    allMovies: data.allMovies || [],
    recommendedMovies: data.recommendedMovies || [],
    sections: data.sections || {},
  };
};
