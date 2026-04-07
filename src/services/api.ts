import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Trigger logout via event
        authEventEmitter.emit('logout');
      }
    }
    return Promise.reject(error);
  }
);

// Simple event emitter for auth state
class AuthEventEmitter {
  private listeners: Record<string, Function[]> = {};
  on(event: string, fn: Function) {
    this.listeners[event] = [...(this.listeners[event] || []), fn];
  }
  off(event: string, fn: Function) {
    this.listeners[event] = (this.listeners[event] || []).filter(l => l !== fn);
  }
  emit(event: string, data?: any) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }
}
export const authEventEmitter = new AuthEventEmitter();

// API methods
export const authAPI = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  updatePushToken: (expoPushToken: string) =>
    api.post('/users/push-token', { expoPushToken }),
};

export const tasksAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getOne: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/tasks/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const commentsAPI = {
  add: (taskId: number, content: string) =>
    api.post(`/comments/tasks/${taskId}`, { content }),
  update: (id: number, content: string) =>
    api.put(`/comments/${id}`, { content }),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: (params?: any) => api.get('/dashboard/activity', { params }),
};

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: number) => api.get(`/users/${id}`),
};

export default api;
