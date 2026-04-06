import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        useAuthStore.getState().updateAccessToken(accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// User API
export const userApi = {
  getCurrentUser: () => api.get('/users/me'),
  getUsers: (params?: { page?: number; size?: number; search?: string }) =>
    api.get('/users', { params }),
  createUser: (data: unknown) => api.post('/users', data),
  updateUser: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Conference API
export const conferenceApi = {
  getConferences: (params?: { page?: number; size?: number; search?: string }) =>
    api.get('/conferences', { params }),
  getActiveConferences: () => api.get('/conferences/active'),
  getUpcomingConferences: () => api.get('/conferences/upcoming'),
  getConference: (id: string) => api.get(`/conferences/${id}`),
  createConference: (data: unknown) => api.post('/conferences', data),
  updateConference: (id: string, data: unknown) => api.put(`/conferences/${id}`, data),
  deleteConference: (id: string) => api.delete(`/conferences/${id}`),
  startConference: (id: string) => api.post(`/conferences/${id}/start`),
  endConference: (id: string) => api.post(`/conferences/${id}/end`),
  generateToken: (id: string, data: unknown) =>
    api.post(`/conferences/${id}/token`, data),
};
