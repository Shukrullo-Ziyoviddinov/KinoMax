/**
 * Backend API bazaviy URL.
 * Lokal: bo‘sh qoldirish mumkin (localhost bilan bir xil origin).
 * Render: frontend (Static Site) va API (Web Service) alohida bo‘lsa,
 * build vaqtida REACT_APP_BASE_URL ni API manziliga qo‘ying, masalan:
 * https://sizning-api.onrender.com
 */
export const BASE_URL =
  process.env.REACT_APP_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const getShareUrl = (path = '') => {
  const base = BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};
