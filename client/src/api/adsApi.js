import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchActiveAd = async () => {
  const res = await fetch(`${getBase()}/api/ads/active`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Reklamani olishda xatolik.");
  }

  return json.data || null;
};
