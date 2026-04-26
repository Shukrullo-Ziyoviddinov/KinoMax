export const AUTH_TOKEN_KEY = 'violet_auth_token';
export const PROFILE_STORAGE_KEY = 'violet_profile';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';

export const isAuthenticated = () => Boolean(getAuthToken());

export const saveAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  if (user) {
    const profilePayload = {
      name: user.firstName || '',
      surname: user.lastName || '',
      phone: user.phone || '',
      avatar: user.avatar ?? null,
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profilePayload));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};
