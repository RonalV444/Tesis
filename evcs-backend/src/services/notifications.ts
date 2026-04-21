import { sendPushNotificationFirebase, sendMulticastNotification } from './firebase';
import { db } from './db';

/**
 * Enviar notificación a un usuario específico
 * Busca todos sus dispositivos activos y envía a todos
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
    // Obtener tokens activos del usuario
    const [tokens] = await db.query(
      'SELECT id, token FROM device_tokens WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    if ((tokens as any[]).length === 0) {
      console.warn(`⚠️ No hay tokens activos para el usuario ${userId}`);
      return {
        success: false,
        error: 'No active device tokens found',
      };
    }

    // Extraer solo los tokens
    const tokenList = (tokens as any[]).map((t) => t.token);

    // Enviar a todos los dispositivos
    const result = await sendMulticastNotification({
      title,
      body,
      tokens: tokenList,
      data,
    });

    // Registrar en la BD
    if (result.success) {
      for (const token of tokens as any[]) {
        await db.query(
          'INSERT INTO notifications_log (device_token_id, title, body, status) VALUES (?, ?, ?, ?)',
          [token.id, title, body, 'Sent']
        );
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Registrar un nuevo token de dispositivo
 */
export async function registerDeviceToken({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  try {
    // Insertar o actualizar token
    const query = `
      INSERT INTO device_tokens (user_id, token, is_active, registered_at)
      VALUES (?, ?, TRUE, NOW())
      ON DUPLICATE KEY UPDATE
        is_active = TRUE,
        registered_at = NOW()
    `;

    await db.query(query, [userId, token]);
    console.log(`✅ Token registrado para usuario ${userId}`);
    return {
      success: true,
      message: 'Token registered successfully',
    };
  } catch (error) {
    console.error('❌ Error registrando token:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Desactivar token cuando la app se desinstala
 */
export async function deactivateDeviceToken(token: string) {
  try {
    await db.query(
      'UPDATE device_tokens SET is_active = FALSE WHERE token = ?',
      [token]
    );
    console.log('✅ Token desactivado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error desactivando token:', error);
    return { success: false, error: String(error) };
  }
}
