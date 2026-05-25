import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from './api';

// Configurar manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private notificationListeners: any[] = [];

  /**
   * Obtener token (mock para demostración)
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      console.log('[Notifications] Generando token mock para demostración...');

      // Solicitar permisos
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.warn('[Notifications] Permisos no concedidos');
          return null;
        }
      }

      // Canal Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Mock token (el backend lo acepta ahora)
      const mockToken = `mock-token-${Date.now()}`;
      console.log('[Notifications] ✅ Token mock generado:', mockToken);
      return mockToken;

    } catch (error: any) {
      console.error('[Notifications] Error:', error.message);
      return null;
    }
  }

  /**
   * Registrar token en el backend
   */
  async registerTokenWithBackend(userId: string): Promise<boolean> {
    try {
      console.log('[Notifications] Registrando token con backend...');
      const token = await this.getDeviceToken();
      if (!token) return false;

      const response = await apiService.registerDeviceToken(userId, token);
      if (response.success) {
        console.log('[Notifications] ✅ Token registrado exitosamente');
        return true;
      }
      console.warn('[Notifications] ⚠️ El backend no aceptó el token:', response.message);
      return false;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return false;
    }
  }

  /**
   * Configurar listeners
   */
  setupNotificationListeners(onNotification: (notification: any) => void): void {
    console.log('[Notifications] Configurando listeners...');

    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] 🔔 Notificación recibida:', notification.request.content.title);
      onNotification(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] 👆 Usuario tocó notificación');
    });

    this.notificationListeners = [foregroundSub, responseSub];
  }

  clearNotificationListeners(): void {
    console.log('[Notifications] Limpiando listeners...');
    this.notificationListeners.forEach((sub) => sub.remove());
    this.notificationListeners = [];
  }

  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EVCS Notificaciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#667eea',
    });
  }

  /**
   * Inicializar después del login
   */
  async initializeNotificationsAfterLogin(
    userId: string,
    onNotification?: (notification: any) => void
  ): Promise<void> {
    console.log('[Notifications] ==================================');
    console.log('[Notifications] Inicializando sistema de notificaciones...');
    await this.setupAndroidChannel();
    await this.registerTokenWithBackend(userId);
    if (onNotification) {
      this.setupNotificationListeners(onNotification);
    }
    console.log('[Notifications] ==================================');
  }
}

export const notificationService = new NotificationService();