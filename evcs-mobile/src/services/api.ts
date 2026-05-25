import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { User, AuthResponse, NotificationsResponse } from '../types';

// URL fija para ADB reverse (localhost funciona con adb reverse tcp:3000)
const API_URL = 'http://localhost:3000/api';
console.log('[API] URL configurada:', API_URL);
console.log('[API] Asegúrate de ejecutar: adb reverse tcp:3000 tcp:3000');

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });

    this.client.interceptors.request.use((config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        if (response.status >= 400) {
          console.error('[API Error]', response.status, response.data);
          throw new Error(response.data?.message || `HTTP ${response.status}`);
        }
        return response;
      },
      (error) => {
        if (error.message === 'Network Error') {
          console.error('[API] Network Error — no se puede conectar a:', API_URL);
          console.error('[API] Verifica: adb reverse tcp:3000 tcp:3000');
        } else {
          console.error('[API Error]', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', { email, password });
    const { data } = response;
    if (data.success) {
      this.setAuthToken(data.token, data.user.id);
      console.log('[API] ✅ Login exitoso:', data.user.email);
    }
    return data;
  }

  async registerDeviceToken(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    console.log('[API] Registrando token para usuario:', userId);
    console.log('[API] Token (primeros 30 chars):', token.substring(0, 30));
    const response = await this.client.post('/notifications/register-token', {
      userId,
      token,
      platform: Platform.OS,
    });
    console.log('[API] Respuesta:', response.data);
    return response.data;
  }

  async deactivateDeviceToken(token: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/notifications/register-token/${encodeURIComponent(token)}`);
    return response.data;
  }

  async getNotificationLogs(userId?: string, limit: number = 50): Promise<NotificationsResponse> {
    const url = userId
      ? `/notifications/logs/user/${userId}?limit=${limit}`
      : `/notifications/logs?limit=${limit}`;
    const response = await this.client.get<NotificationsResponse>(url);
    return response.data;
  }

  async getBackendStatus(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  setAuthToken(token: string, userId: string): void {
    this.token = token;
    this.userId = userId;
  }

  getAuthToken(): string | null { return this.token; }
  getUserId(): string | null { return this.userId; }
  clearAuth(): void { this.token = null; this.userId = null; }
}

export const apiService = new ApiService();