import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchMoviesList = async () => {
  const res = await fetch(`${getBase()}/api/movies`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || 'Kinolar ro\'yxatini olishda xatolik.');
  }

  return Array.isArray(json.data) ? json.data : [];
};

export const fetchMovieById = async (id) => {
  const movieId = Number(id);
  if (!Number.isFinite(movieId)) {
    throw new Error("Noto'g'ri kino id.");
  }

  const res = await fetch(`${getBase()}/api/movies/${movieId}`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || 'Kino topilmadi.');
  }

  return json.data;
};
