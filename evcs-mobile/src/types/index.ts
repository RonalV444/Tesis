// Tipos para autenticación
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationLog {
  id: string;
  userId: string;
  title: string;
  body: string;
  sentAt: string;
  type: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  metadata?: Record<string, any>;
}

export interface DeviceToken {
  userId: string;
  token: string;
  createdAt: string;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NotificationsResponse {
  total: number;
  data: NotificationLog[];
}

// Tipos para FCM
export interface FCMMessage {
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
}
