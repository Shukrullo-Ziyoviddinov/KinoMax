import { apiClient } from '../services/apiClient';
import { BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/authStorage';
import { createApiError, normalizeApiError } from '../utils/errorHandler';

export const fetchMoviesCatalog = async ({ page = 1, limit = 30 } = {}) => {
  const query = `?page=${page}&limit=${limit}`;
  const token = getAuthToken();
  if (!token) {
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
  }

  try {
    const base = BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${base}/api/movies-catalog${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    const payload = json?.data || {};
    return {
      allMovies: payload.allMovies || [],
      recommendedMovies: payload.recommendedMovies || [],
      sections: payload.sections || {},
      meta: json?.meta || null,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};
