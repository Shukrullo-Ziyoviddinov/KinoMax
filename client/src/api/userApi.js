import { BASE_URL } from '../config/api';
import { createApiError, normalizeApiError } from '../utils/errorHandler';
import { getAuthToken } from '../utils/authStorage';

const getBase = () => BASE_URL.replace(/\/$/, '');
const toUrl = (path) => `${getBase()}${path.startsWith('/') ? path : `/${path}`}`;

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch (_error) {
    return null;
  }
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
});

export const fetchWishlist = async () => {
  try {
    const response = await fetch(toUrl('/api/user/wishlist'), { headers: authHeaders() });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return Array.isArray(json?.data?.wishlist) ? json.data.wishlist : [];
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const fetchUserProfile = async () => {
  try {
    const response = await fetch(toUrl('/api/user/profile'), { headers: authHeaders() });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data || null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const updateUserProfile = async ({ firstName, lastName, avatar }) => {
  try {
    const response = await fetch(toUrl('/api/user/profile'), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ firstName, lastName, avatar }),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data || null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const addWishlist = async (movieId) => {
  try {
    const response = await fetch(toUrl('/api/user/wishlist'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ movieId }),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return Array.isArray(json?.data?.wishlist) ? json.data.wishlist : [];
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const removeWishlist = async (movieId) => {
  try {
    const response = await fetch(toUrl(`/api/user/wishlist/${movieId}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return Array.isArray(json?.data?.wishlist) ? json.data.wishlist : [];
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const fetchMovieReaction = async (movieId) => {
  try {
    const response = await fetch(toUrl(`/api/user/reactions/movie/${movieId}`), { headers: authHeaders() });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data?.reaction || null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const setMovieReaction = async (movieId, reaction) => {
  try {
    const response = await fetch(toUrl('/api/user/reactions/movie'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ movieId, reaction }),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data?.reaction || null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const removeMovieReaction = async (movieId) => {
  try {
    const response = await fetch(toUrl(`/api/user/reactions/movie/${movieId}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const fetchTrailerReactions = async (movieId) => {
  try {
    const response = await fetch(toUrl(`/api/user/reactions/trailer?movieId=${movieId}`), { headers: authHeaders() });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data?.reactions || {};
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const setTrailerReaction = async ({ movieId, trailerId, reaction }) => {
  try {
    const response = await fetch(toUrl('/api/user/reactions/trailer'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ movieId, trailerId, reaction }),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return json?.data?.reaction || null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const removeTrailerReaction = async ({ movieId, trailerId }) => {
  try {
    const response = await fetch(toUrl(`/api/user/reactions/trailer/${movieId}/${trailerId}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return null;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const addViewedMovie = async (movieId) => {
  try {
    const response = await fetch(toUrl('/api/user/viewed-movies'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ movieId }),
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    return Array.isArray(json?.data?.viewedMovies) ? json.data.viewedMovies : [];
  } catch (error) {
    throw normalizeApiError(error);
  }
};
