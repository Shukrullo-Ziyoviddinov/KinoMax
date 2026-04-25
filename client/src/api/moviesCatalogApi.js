import { apiClient } from '../services/apiClient';

export const fetchMoviesCatalog = async ({ page = 1, limit = 30 } = {}) => {
  const query = `?page=${page}&limit=${limit}`;
  const data = await apiClient.get(`/api/movies-catalog${query}`, {
    cacheKey: `movies-catalog:${page}:${limit}`,
    ttlMs: 60 * 1000,
    dedupeKey: `movies-catalog:${page}:${limit}`,
    includeMeta: true,
  });
  const payload = data?.data || {};
  const meta = data?.meta || null;
  return {
    allMovies: payload.allMovies || [],
    recommendedMovies: payload.recommendedMovies || [],
    sections: payload.sections || {},
    meta,
  };
};
