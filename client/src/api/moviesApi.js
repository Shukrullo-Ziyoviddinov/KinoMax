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

export const fetchTopRatedMovies = async ({ page = 1, limit = 20 } = {}) => {
  const query = `?page=${page}&limit=${limit}`;
  const data = await apiClient.get(`/api/movies/top-rated${query}`, {
    cacheKey: `movies:top-rated:${page}:${limit}`,
    ttlMs: 30 * 1000,
    dedupeKey: `movies:top-rated:${page}:${limit}`,
    includeMeta: true,
  });

  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || null,
  };
};
