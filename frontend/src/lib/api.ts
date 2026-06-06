/**
 * Preconfigured Axios instance for all backend API calls.
 * Request interceptor reads the active Supabase session and attaches the JWT as
 * "Authorization: Bearer <token>" on every request.
 * Response interceptor auto-signs-out the user and redirects to /login on any 401.
 * Export: api (AxiosInstance) — the sole HTTP client used by all TanStack Query hooks.
 */
import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
