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
 * Enviar notificación push usando Firebase Admin SDK
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
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (tokens.length === 0) {
    console.warn('⚠️ No hay tokens para enviar notificaciones');
    return {
      success: false,
      error: 'No tokens provided',
    };
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

  try {
    // Enviar a cada token por separado (más compatible)
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
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

    console.log(`✅ Notificaciones enviadas: ${successCount}/${tokens.length}`);
    
    if (failureCount > 0) {
      console.warn(`⚠️ Fallos: ${failureCount}`);
      results.forEach((resp: any) => {
        if (!resp.success) {
          console.error(`  - Token ${resp.token}: ${resp.error}`);
        }
      });
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results,
    };
  } catch (error) {
    console.error('❌ Error enviando notificaciones masivas:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Suscribir tokens a un tema
 */
export async function subscribeToTopic(tokens: string[], topic: string) {
  if (!firebaseApp) {
    initializeFirebase();
  }

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
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
  if (!firebaseApp) {
    initializeFirebase();
  }

  try {
    // Intentar enviar un mensaje de prueba
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
