import type { User } from '../types/domain';

const TOKEN_KEY = 'radreport.token';
const USER_KEY = 'radreport.user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export const setStoredUser = (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const clearStoredUser = () => localStorage.removeItem(USER_KEY);
export const clearSession = () => {
  clearStoredToken();
  clearStoredUser();
};
