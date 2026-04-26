import { BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/authStorage';
import { createApiError, normalizeApiError } from '../utils/errorHandler';

const LIKED_PREFIX = 'violet_comment_liked_';
const getBase = () => BASE_URL.replace(/\/$/, '');
const toUrl = (path) => `${getBase()}${path.startsWith('/') ? path : `/${path}`}`;
const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch (_error) {
    return null;
  }
};

/** movieId har doim bir xil formatda (aralashmasin) */
export const toMovieKey = (movieId) => String(movieId);

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Array} Kommentlar ro'yxati (faqat shu kinoga tegishli)
 */
export const getComments = (movieId) => {
  return fetchComments(movieId);
};

export const fetchComments = async (movieId) => {
  try {
    const response = await fetch(toUrl(`/api/movies/${toMovieKey(movieId)}/comments`));
    const json = await parseJsonSafe(response);
    if (!response.ok || !(json?.success ?? json?.ok)) {
      throw createApiError(json?.message || `HTTP ${response.status}`, response.status, json);
    }
    const list = json?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * @param {string|number} movieId - Kino ID
 * @param {Array} comments - Yangilangan kommentlar
 */
export const createComment = async (movieId, payload) => {
  try {
    const response = await fetch(toUrl(`/api/movies/${toMovieKey(movieId)}/comments`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
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

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Set<string>} Like qilingan comment ID'lar (faqat shu kinoga)
 */
export const getLikedIds = (movieId) => {
  try {
    const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('getLikedIds error:', e);
  }
  return new Set();
};

/**
 * @param {string|number} movieId - Kino ID
 * @param {Set<string>} likedIds - Yangilangan like ID'lar
 */
export const saveLikedIds = (movieId, likedIds) => {
  try {
    const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
    localStorage.setItem(key, JSON.stringify([...likedIds]));
  } catch (e) {
    console.warn('saveLikedIds error:', e);
  }
};
