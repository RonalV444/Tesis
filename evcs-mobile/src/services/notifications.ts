// Servicio para gestionar notificaciones push con Firebase Cloud Messaging
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
  private notificationListeners: Array<(notification: any) => void> = [];

  /**
   * Obtener token FCM del dispositivo
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      console.log('[Notifications] Obteniendo token del dispositivo...');

      if (!Device.isDevice) {
        console.log('[Notifications] Advertencia: No es un dispositivo real. Usando token mock.');
        return `mock-token-${Date.now()}`;
      }

      // Configurar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] ⚠️ Permisos de notificaciones no concedidos');
        return `mock-token-no-perms-${Date.now()}`;
      }

      // Para Expo, usamos expoPushToken en lugar de FCM token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.firebaseProjectId;
      
      if (!projectId) {
        console.warn('[Notifications] ⚠️ Project ID no configurado en app.json');
        return `mock-token-no-project-${Date.now()}`;
      }

      try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[Notifications] ✅ Token Expo obtenido:', token.substring(0, 20) + '...');
        return token;
      } catch (tokenError: any) {
        console.error('[Notifications] ⚠️ Error obteniendo token Expo:', tokenError.message);
        console.log('[Notifications] Usando mock token como fallback');
        return `mock-token-expo-error-${Date.now()}`;
      }
    } catch (error) {
      console.error('[Notifications] ❌ Error obteniendo token:', error);
      console.log('[Notifications] Usando mock token como fallback');
      return `mock-token-error-${Date.now()}`;
    }
  }

  /**
   * Configurar listeners para notificaciones
   */
  setupNotificationListeners(onNotification: (notification: any) => void): void {
    console.log('[Notifications] Configurando listeners...');

    // Listener cuando la app está en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Notificación recibida en foreground:', notification.request.content.title);
      onNotification(notification);
    });

    // Listener para respuestas de notificaciones (cuando el usuario toca la notificación)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] Usuario interactuó con notificación:', response.notification.request.content.title);
      // Aquí se puede navegar a una pantalla específica si es necesario
    });

    this.notificationListeners = [foregroundSubscription, responseSubscription];
  }

  /**
   * Limpiar listeners
   */
  clearNotificationListeners(): void {
    console.log('[Notifications] Limpiando listeners...');
    this.notificationListeners.forEach((subscription) => subscription.remove());
    this.notificationListeners = [];
  }

  /**
   * Enviar notificación local de prueba
   */
  async sendLocalNotification(title: string, body: string): Promise<void> {
    try {
      console.log('[Notifications] Enviando notificación local:', title);
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          badge: 1,
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('[Notifications] Error enviando notificación local:', error);
    }
  }

  /**
   * Verificar permisos de notificaciones
   */
  async checkNotificationPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      console.log('[Notifications] Estado de permisos:', status);
      return status === 'granted';
    } catch (error) {
      console.error('[Notifications] Error verificando permisos:', error);
      return false;
    }
  }

  /**
   * Solicitar permisos de notificaciones
   */
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      console.log('[Notifications] Solicitando permisos...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[Notifications] Permisos:', status);
      return status === 'granted';
    } catch (error) {
      console.error('[Notifications] Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Configurar canal de notificaciones para Android
   */
  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      console.log('[Notifications] Configurando canal Android...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
    } catch (error) {
      console.error('[Notifications] Error configurando canal Android:', error);
    }
  }

  /**
   * Solicitar token del dispositivo (con permisos)
   * Esto es un alias más descriptivo de getDeviceToken()
   */
  async requestDeviceToken(): Promise<string | null> {
    return this.getDeviceToken();
  }

  /**
   * Registrar el token del dispositivo en el backend
   * Combina obtención de token + registro en una sola operación
   */
  async registerTokenWithBackend(userId: string): Promise<boolean> {
    try {
      console.log('[Notifications] Iniciando registro de token con backend...');

      // 1. Obtener el token del dispositivo
      const deviceToken = await this.getDeviceToken();

      if (!deviceToken) {
        console.warn('[Notifications] No se pudo obtener el token del dispositivo');
        return false;
      }

      // 2. Registrar el token en el backend
      console.log('[Notifications] Enviando token al backend...');
      const response = await apiService.registerDeviceToken(userId, deviceToken);

      if (response.success) {
        console.log('[Notifications] ✅ Token registrado exitosamente en el backend');
        return true;
      } else {
        console.warn('[Notifications] ⚠️ El backend respondió sin éxito:', response.message);
        return false;
      }
    } catch (error) {
      console.error('[Notifications] ❌ Error registrando token con backend:', error);
      return false;
    }
  }

  /**
   * Inicializar notificaciones y registrar token
   * Este es el método principal que se debe llamar en el login
   */
  async initializeNotificationsAfterLogin(
    userId: string,
    onNotification?: (notification: any) => void
  ): Promise<void> {
    try {
      console.log('[Notifications] Inicializando notificaciones...');

      // 1. Configurar canal Android si es necesario
      await this.setupAndroidChannel();

      // 2. Solicitar permisos
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        console.warn('[Notifications] Permisos de notificaciones no concedidos');
        // Continuar de todas formas, puede ser que después los conceda el usuario
      }

      // 3. Registrar token en el backend
      const tokenRegistered = await this.registerTokenWithBackend(userId);
      if (!tokenRegistered) {
        console.warn('[Notifications] No se pudo registrar el token en el backend');
      }

      // 4. Configurar listeners para recibir notificaciones
      if (onNotification) {
        this.setupNotificationListeners(onNotification);
      }

      console.log('[Notifications] ✅ Notificaciones inicializadas correctamente');
    } catch (error) {
      console.error('[Notifications] Error inicializando notificaciones:', error);
    }
  }
}

export const notificationService = new NotificationService();
