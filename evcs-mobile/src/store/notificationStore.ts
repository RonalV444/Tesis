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

      const formattedNotifications = response.data.map((log: any) => ({
        id: log.id,
        title: log.title,
        body: log.body,
        timestamp: log.sentAt,
        read: false,
        type: log.type,
      }));

      set({
        notifications: formattedNotifications,
        receivedNotifications: formattedNotifications,
        isLoading: false,
        error: null,
      });
      console.log('[NotificationStore] Notificaciones cargadas:', formattedNotifications.length);
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
      let title, body, type;
      
      if (notification.request?.content) {
        title = notification.request.content.title;
        body = notification.request.content.body;
        type = notification.request.content.data?.type || 'R1';
      } else {
        title = notification.title;
        body = notification.body;
        type = notification.type || 'R1';
      }

      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        title: title || 'Notificación',
        body: body || '',
        timestamp: new Date().toISOString(),
        read: false,
        type: type,
      };

      console.log('[NotificationStore] Nueva notificación recibida:', newNotification.title);

      set((state) => {
        const updatedList = [newNotification, ...state.receivedNotifications].slice(0, 100);
        return {
          receivedNotifications: updatedList,
          notifications: updatedList,
          unreadCount: state.unreadCount + 1,
        };
      });
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
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      receivedNotifications: state.receivedNotifications.map((n) => ({ ...n, read: true })),
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));