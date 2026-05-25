// Store global para notificaciones usando Zustand
import { create } from 'zustand';
import { NotificationLog } from '../types';
import { apiService } from '../services/api';

interface NotificationState {
  // Estado
  notifications: NotificationLog[];
  receivedNotifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  // Acciones
  fetchNotifications: (userId?: string) => Promise<void>;
  addReceivedNotification: (notification: any) => void;
  clearNotifications: () => void;
  clearError: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type?: string;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  receivedNotifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('[NotificationStore] Obteniendo notificaciones...');

      const response = await apiService.getNotificationLogs(userId);

      set({
        notifications: response.data,
        isLoading: false,
        error: null,
      });
      console.log('[NotificationStore] Notificaciones cargadas:', response.data.length);
    } catch (error: any) {
      const errorMessage = error.message || 'Error obteniendo notificaciones';
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error('[NotificationStore] Error:', errorMessage);
    }
  },

  addReceivedNotification: (notification: any) => {
    try {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        title: notification.request?.content?.title || 'Notificación',
        body: notification.request?.content?.body || '',
        timestamp: new Date().toISOString(),
        read: false,
        type: notification.request?.content?.data?.type || 'unknown',
      };

      console.log('[NotificationStore] Nueva notificación recibida:', newNotification.title);

      set((state) => ({
        receivedNotifications: [newNotification, ...state.receivedNotifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      }));
    } catch (error) {
      console.error('[NotificationStore] Error procesando notificación:', error);
    }
  },

  clearNotifications: () => {
    set({
      notifications: [],
      receivedNotifications: [],
      unreadCount: 0,
    });
    console.log('[NotificationStore] Notificaciones limpiadas');
  },

  clearError: () => {
    set({ error: null });
  },

  markAsRead: (notificationId: string) => {
    set((state) => ({
      receivedNotifications: state.receivedNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      receivedNotifications: state.receivedNotifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
