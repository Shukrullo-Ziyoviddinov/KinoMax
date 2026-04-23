import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchActorsByIds = async (ids = []) => {
  const normalized = (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!normalized.length) return [];

  const res = await fetch(`${getBase()}/api/actors/by-ids?ids=${normalized.join(',')}`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || 'Actorlarni olishda xatolik.');
  }

  return Array.isArray(json.data) ? json.data : [];
};

export const fetchActorById = async (id) => {
  const actorId = Number(id);
  if (!Number.isFinite(actorId)) {
    throw new Error("Noto'g'ri actor id.");
  }

  const res = await fetch(`${getBase()}/api/actors/${actorId}`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || 'Actor topilmadi.');
  }

  return json.data;
};
