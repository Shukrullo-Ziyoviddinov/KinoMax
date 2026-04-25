import { apiClient } from '../services/apiClient';

export const fetchMoviesCatalog = async () => {
  const data = await apiClient.get('/api/movies-catalog', {
    cacheKey: 'movies-catalog',
    ttlMs: 60 * 1000,
    dedupeKey: 'movies-catalog',
  });
  const payload = data || {};
  return {
    allMovies: payload.allMovies || [],
    recommendedMovies: payload.recommendedMovies || [],
    sections: payload.sections || {},
  };
};
