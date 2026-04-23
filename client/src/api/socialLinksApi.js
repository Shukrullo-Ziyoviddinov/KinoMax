import { BASE_URL } from '../config/api';

const getBase = () => BASE_URL.replace(/\/$/, '');

export const fetchSocialLinks = async () => {
  const res = await fetch(`${getBase()}/api/social-links`);
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Ijtimoiy linklarni olishda xatolik.");
  }

  const data = json.data || {};
  return {
    contact: data.contact || {},
    social: data.social || {},
    appStore: data.appStore || {},
  };
};
