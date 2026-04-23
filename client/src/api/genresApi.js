import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchGenres = async () => {
  const res = await fetch(`${getBase()}/api/genres`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || 'Janrlarni olishda xatolik.');
  }

  return Array.isArray(json.data) ? json.data : [];
};
