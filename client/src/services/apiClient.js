import { BASE_URL } from '../config/api';
import { getOrSetCache } from '../utils/cache';
import { createApiError, normalizeApiError } from '../utils/errorHandler';

const getBase = () => BASE_URL.replace(/\/$/, '');

const inFlightRequests = new Map();

const toUrl = (path) => `${getBase()}${path.startsWith('/') ? path : `/${path}`}`;

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch (_error) {
    return null;
  }
};

const parseApiPayload = (json, fallbackMessage) => {
  if (!json) {
    throw createApiError(fallbackMessage, 500, null);
  }
  const success = Boolean(json.success ?? json.ok);
  if (!success) {
    throw createApiError(json.message || fallbackMessage, json.status || 500, json);
  }
  return json.data;
};

const request = async (path, options = {}) => {
  const response = await fetch(toUrl(path), options);
  const json = await parseJsonSafe(response);

  if (!response.ok) {
    throw createApiError(
      json?.message || `HTTP ${response.status}`,
      response.status,
      json
    );
  }

  return parseApiPayload(json, 'Server javobida xatolik.');
};

const dedupeRequest = async (key, factory) => {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = factory().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
};

export const apiClient = {
  async get(path, { cacheKey, ttlMs = 0, dedupeKey } = {}) {
    const key = dedupeKey || `GET:${path}`;
    try {
      const runner = () => request(path);
      if (cacheKey) {
        return await getOrSetCache(cacheKey, () => dedupeRequest(key, runner), ttlMs);
      }
      return await dedupeRequest(key, runner);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
