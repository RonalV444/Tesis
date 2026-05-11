import { sendPushNotificationFirebase, sendMulticastNotification } from './firebase';
import { db, memoryDB } from './db';
import webPush from 'web-push';

// Configurar web-push (para PWA)
const VAPID_PUBLIC_KEY = 'BCfW64tuCjOuf1iXXPna9U3sHSRyLo_Kd27jwFOik0HZM6E0HLlK9PXEaOogVgdsPyqmqUTC2neJwZJecBTccxw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

webPush.setVapidDetails(
  'mailto:evcs@tesis.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Enviar notificación a un usuario específico
 * Soporta tanto tokens móviles (FCM) como suscripciones web (PushSubscription)
 */
export async function sendNotificationToUser({
  userId,
  title,
  body,
  data = {},
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    // 1. Obtener tokens móviles (FCM)
    const [tokens] = await db.query(
      'SELECT id, token FROM device_tokens WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // 2. Obtener suscripciones web (PWA)
    const webSubscriptions = memoryDB.webSubscriptions?.filter((sub: any) => sub.userId === userId) || [];

    let mobileResult = { success: true, successCount: 0, failureCount: 0 };
    let webResult = { success: true, successCount: 0, failureCount: 0 };

    // Enviar a dispositivos móviles (FCM)
    if ((tokens as any[]).length > 0) {
      const tokenList = (tokens as any[]).map((t) => t.token);
      const fcmResult = await sendMulticastNotification({
        title,
        body,
        tokens: tokenList,
        data,
      });
      
      if (fcmResult.success) {
        mobileResult.successCount = fcmResult.successCount || 0;
        mobileResult.failureCount = fcmResult.failureCount || 0;
      } else {
        mobileResult.success = false;
      }

      // Registrar en la BD
      for (const token of tokens as any[]) {
        await db.query(
          'INSERT INTO notifications_log (device_token_id, title, body, status) VALUES (?, ?, ?, ?)',
          [token.id, title, body, 'Sent']
        );
      }
    }

    // Enviar a suscripciones web (PWA)
    for (const subscription of webSubscriptions) {
      try {
        await webPush.sendNotification(
          subscription.subscription,
          JSON.stringify({ title, body, data, timestamp: new Date().toISOString() })
        );
        webResult.successCount++;
        console.log(`✅ Notificación web enviada a ${subscription.userId}`);
      } catch (err: any) {
        webResult.failureCount++;
        console.error(`❌ Error enviando notificación web:`, err);
        // Si la suscripción expiró, eliminarla
        if (err && err.statusCode === 410) {
          const index = memoryDB.webSubscriptions.findIndex((s: any) => s.endpoint === subscription.subscription.endpoint);
          if (index !== -1) memoryDB.webSubscriptions.splice(index, 1);
        }
      }
    }

    return {
      success: true,
      mobile: { successCount: mobileResult.successCount, failureCount: mobileResult.failureCount },
      web: { successCount: webResult.successCount, failureCount: webResult.failureCount }
    };
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Registrar suscripción web (para PWA)
 */
export async function registerWebSubscription({
  userId,
  subscription,
}: {
  userId: string;
  subscription: webPush.PushSubscription;
}) {
  try {
    if (!memoryDB.webSubscriptions) {
      memoryDB.webSubscriptions = [];
    }
    
    // Verificar si ya existe
    const exists = memoryDB.webSubscriptions.some((s: any) => s.userId === userId && s.endpoint === subscription.endpoint);
    if (!exists) {
      memoryDB.webSubscriptions.push({
        userId,
        subscription,
        endpoint: subscription.endpoint,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log(`✅ Suscripción web registrada para usuario ${userId}`);
    return { success: true, message: 'Web subscription registered' };
  } catch (error) {
    console.error('❌ Error registrando suscripción web:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Eliminar suscripción web
 */
export async function unregisterWebSubscription(endpoint: string) {
  try {
    if (memoryDB.webSubscriptions) {
      const index = memoryDB.webSubscriptions.findIndex((s: any) => s.endpoint === endpoint);
      if (index !== -1) {
        memoryDB.webSubscriptions.splice(index, 1);
      }
    }
    console.log(`✅ Suscripción web eliminada`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando suscripción web:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Registrar un nuevo token de dispositivo (móvil)
 */
export async function registerDeviceToken({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  try {
    const query = `
      INSERT INTO device_tokens (user_id, token, is_active, registered_at)
      VALUES (?, ?, TRUE, NOW())
      ON DUPLICATE KEY UPDATE
        is_active = TRUE,
        registered_at = NOW()
    `;
    await db.query(query, [userId, token]);
    console.log(`✅ Token móvil registrado para usuario ${userId}`);
    return { success: true, message: 'Token registered successfully' };
  } catch (error) {
    console.error('❌ Error registrando token:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Desactivar token de dispositivo (móvil)
 */
export async function deactivateDeviceToken(token: string) {
  try {
    await db.query(
      'UPDATE device_tokens SET is_active = FALSE WHERE token = ?',
      [token]
    );
    console.log('✅ Token móvil desactivado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error desactivando token:', error);
    return { success: false, error: String(error) };
  }
}