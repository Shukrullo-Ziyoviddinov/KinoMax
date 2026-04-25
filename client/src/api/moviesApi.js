import { apiClient } from '../services/apiClient';

export const fetchMoviesList = async () => {
  const data = await apiClient.get('/api/movies', {
    cacheKey: 'movies:list',
    ttlMs: 30 * 1000,
    dedupeKey: 'movies:list',
  });
  return Array.isArray(data) ? data : [];
};

export const fetchMovieById = async (id) => {
  const movieId = Number(id);
  if (!Number.isFinite(movieId)) {
    throw new Error("Noto'g'ri kino id.");
  }

  return apiClient.get(`/api/movies/${movieId}`, {
    cacheKey: `movies:${movieId}`,
    ttlMs: 30 * 1000,
    dedupeKey: `movies:${movieId}`,
  });
};
