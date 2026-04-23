/**
 * API so‘rovlari uchun host prefiksi (oxiridagi / yo‘q).
 * Bo‘sh bo‘lsa, nisbiy yo‘l ishlatiladi: `/api/...` — sahifa qaysi domen bilan
 * yuklangan bo‘lsa, so‘rov ham o‘sha domenga ketadi (Express `client/build` bilan
 * bir xil servisda — Render uchun eng ishonchli variant).
 *
 * Faqat frontend va backend alohida domenlarda host qilinganda buildda
 * REACT_APP_BASE_URL=https://api.example.com qo‘ying.
 */
export const BASE_URL = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

export const getShareUrl = (path = "") => {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    const base = window.location.origin.replace(/\/$/, "");
    return `${base}${p}`;
  }
  const base = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");
  return base ? `${base}${p}` : p;
};
