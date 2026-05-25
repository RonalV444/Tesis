import admin from 'firebase-admin';
import { config } from '../config/env';

/**
 * Inicializar Firebase Admin SDK
 * Requiere: archivo de credenciales en FIREBASE_CREDENTIALS_PATH
 */
let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
  if (firebaseApp) {
    console.log('✅ Firebase ya inicializado');
    return firebaseApp;
  }

  try {
    const credentialsPath = config.firebase.credentialsPath;
    
    if (!credentialsPath) {
      throw new Error('FIREBASE_CREDENTIALS_PATH no configurado');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentialsPath as any),
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Verificar si es un token mock (para desarrollo)
 */
function isMockToken(token: string): boolean {
  if (!token) return false;
  return token.startsWith('mock-token') || token === 'mock-token';
}

/**
 * Enviar notificación push usando Firebase Admin SDK
 * Soporta tokens mock (simula éxito sin enviar)
 */
export async function sendPushNotificationFirebase({
  title,
  body,
  token,
  data = {},
}: {
  title: string;
  body: string;
  token: string;
  data?: Record<string, string>;
}) {
  // Si es mock token, simular éxito sin enviar a Firebase
  if (isMockToken(token)) {
    console.log(`[FCM] 🔔 Simulando envío de notificación (mock token): ${title}`);
    console.log(`[FCM] Body: ${body}`);
    console.log(`[FCM] Token: ${token.substring(0, 50)}...`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      simulated: true
    };
  }

  if (!firebaseApp) {
    initializeFirebase();
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      timestamp: new Date().toISOString(),
      ...data,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notificación enviada exitosamente:', response);
    return {
      success: true,
      messageId: response,
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
 * Enviar notificación a múltiples dispositivos
 */
export async function sendMulticastNotification({
  title,
  body,
  tokens,
  data = {},
}: {
  title: string;
  body: string;
  tokens: string[];
  data?: Record<string, string>;
}) {
  // Filtrar tokens mock y reales
  const mockTokens = tokens.filter(t => isMockToken(t));
  const realTokens = tokens.filter(t => !isMockToken(t));

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  // Procesar mock tokens (simular éxito)
  for (const token of mockTokens) {
    console.log(`[FCM] 🔔 Simulando envío a mock token: ${title}`);
    results.push({ token, success: true, messageId: `mock-${Date.now()}`, simulated: true });
    successCount++;
  }

  // Procesar tokens reales
  if (realTokens.length > 0) {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        timestamp: new Date().toISOString(),
        ...data,
      },
    };

    for (const token of realTokens) {
      try {
        const response = await admin.messaging().send({
          ...message,
          token,
        } as any);
        results.push({ token, success: true, messageId: response });
        successCount++;
      } catch (error) {
        results.push({ token, success: false, error: String(error) });
        failureCount++;
      }
    }
  }

  console.log(`✅ Notificaciones procesadas: ${successCount} éxitos, ${failureCount} fallos`);
  
  return {
    success: successCount > 0,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Suscribir tokens a un tema
 */
export async function subscribeToTopic(tokens: string[], topic: string) {
  // Filtrar mock tokens (no se pueden suscribir a temas reales)
  const realTokens = tokens.filter(t => !isMockToken(t));
  
  if (realTokens.length === 0) {
    console.log(`[FCM] Simulando suscripción al tema "${topic}" para ${tokens.length} mock tokens`);
    return { success: true, successCount: tokens.length };
  }

  if (!firebaseApp) {
    initializeFirebase();
  }

  try {
    const response = await admin.messaging().subscribeToTopic(realTokens, topic);
    console.log(`✅ Tokens suscritos al tema "${topic}"`);
    return {
      success: true,
      successCount: response.successCount,
    };
  } catch (error) {
    console.error('❌ Error suscribiendo al tema:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Verificar token de dispositivo
 */
export async function isValidToken(token: string): Promise<boolean> {
  if (isMockToken(token)) {
    console.log(`[FCM] ✅ Mock token considerado válido para demostración`);
    return true;
  }

  if (!firebaseApp) {
    initializeFirebase();
  }

  try {
    await admin.messaging().send({
      token,
      data: { test: 'true' },
    } as any);
    return true;
  } catch (error) {
    console.warn('⚠️ Token inválido o expirado:', token);
    return false;
  }
}

export { admin };