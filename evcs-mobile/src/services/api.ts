// Servicio API para comunicarse con el backend
import axios, { AxiosInstance } from 'axios';
import { User, LoginRequest, AuthResponse, NotificationsResponse } from '../types';

 const API_URL = 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000, // Aumentado de 10s a 30s
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // No lanzar error en status codes, manejar manualmente
    });

    // Interceptor para agregar token a todas las solicitudes
    this.client.interceptors.request.use(
      (config) => {
        const url = `${config.baseURL}${config.url}`;
        console.log(`[API Request] ${config.method?.toUpperCase()} ${url}`);
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejo de errores
    this.client.interceptors.response.use(
      (response) => {
        if (response.status >= 400) {
          console.error('[API Error]', response.status, response.data);
          const error = new Error(response.data?.message || `HTTP ${response.status}`);
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        if (error.code === 'ECONNABORTED') {
          console.error('[API Error] Timeout - Backend no responde en 30s');
        } else if (error.message === 'Network Error') {
          console.error('[API Error] Network Error - No se puede conectar a:', API_URL);
        } else {
          console.error('[API Error]', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticación
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('[API] Iniciando login para:', email);
      const response = await this.client.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { data } = response;
      if (data.success) {
        this.setAuthToken(data.token, data.user.id);
        console.log('[API] Login exitoso:', data.user.email);
      }
      return data;
    } catch (error) {
      console.error('[API] Error en login:', error);
      throw error;
    }
  }

  // Registrar token de dispositivo
  async registerDeviceToken(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[API] Registrando token FCM para usuario:', userId);
      const response = await this.client.post('/notifications/register-token', {
        userId,
        token,
      });
      console.log('[API] Token registrado exitosamente');
      return response.data;
    } catch (error) {
      console.error('[API] Error registrando token:', error);
      throw error;
    }
  }

  // Desactivar token de dispositivo
  async deactivateDeviceToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[API] Desactivando token:', token);
      const response = await this.client.delete(`/notifications/register-token/${token}`);
      console.log('[API] Token desactivado');
      return response.data;
    } catch (error) {
      console.error('[API] Error desactivando token:', error);
      throw error;
    }
  }

  // Obtener logs de notificaciones
  async getNotificationLogs(userId?: string, limit: number = 50): Promise<NotificationsResponse> {
    try {
      const url = userId 
        ? `/notifications/logs/user/${userId}?limit=${limit}`
        : `/notifications/logs?limit=${limit}`;
      
      console.log('[API] Obteniendo logs de notificaciones:', url);
      const response = await this.client.get<NotificationsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[API] Error obteniendo logs:', error);
      throw error;
    }
  }

  // Obtener estatus del backend
  async getBackendStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      console.log('[API] Verificando estado del backend');
      const response = await this.client.get('/health');
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('[API] Backend no disponible:', error);
      throw error;
    }
  }

  // Setear token y userId localmente
  setAuthToken(token: string, userId: string): void {
    this.token = token;
    this.userId = userId;
    console.log('[API] Token de autenticación seteado');
  }

  // Obtener token actual
  getAuthToken(): string | null {
    return this.token;
  }

  // Obtener userId actual
  getUserId(): string | null {
    return this.userId;
  }

  // Limpiar autenticación
  clearAuth(): void {
    this.token = null;
    this.userId = null;
    console.log('[API] Autenticación limpiada');
  }
}

export const apiService = new ApiService();
