"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = sendNotificationToUser;
exports.registerDeviceToken = registerDeviceToken;
exports.deactivateDeviceToken = deactivateDeviceToken;
const firebase_1 = require("./firebase");
const db_1 = require("./db");
/**
 * Enviar notificación a un usuario específico
 * Busca todos sus dispositivos activos y envía a todos
 */
async function sendNotificationToUser({ userId, title, body, data = {}, }) {
    try {
        // Obtener tokens activos del usuario
        const [tokens] = await db_1.db.query('SELECT id, token FROM device_tokens WHERE user_id = ? AND is_active = TRUE', [userId]);
        if (tokens.length === 0) {
            console.warn(`⚠️ No hay tokens activos para el usuario ${userId}`);
            return {
                success: false,
                error: 'No active device tokens found',
            };
        }
        // Extraer solo los tokens
        const tokenList = tokens.map((t) => t.token);
        // Enviar a todos los dispositivos
        const result = await (0, firebase_1.sendMulticastNotification)({
            title,
            body,
            tokens: tokenList,
            data,
        });
        // Registrar en la BD
        if (result.success) {
            for (const token of tokens) {
                await db_1.db.query('INSERT INTO notifications_log (device_token_id, title, body, status) VALUES (?, ?, ?, ?)', [token.id, title, body, 'Sent']);
            }
        }
        return result;
    }
    catch (error) {
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
async function registerDeviceToken({ userId, token, }) {
    try {
        // Insertar o actualizar token
        const query = `
      INSERT INTO device_tokens (user_id, token, is_active, registered_at)
      VALUES (?, ?, TRUE, NOW())
      ON DUPLICATE KEY UPDATE
        is_active = TRUE,
        registered_at = NOW()
    `;
        await db_1.db.query(query, [userId, token]);
        console.log(`✅ Token registrado para usuario ${userId}`);
        return {
            success: true,
            message: 'Token registered successfully',
        };
    }
    catch (error) {
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
async function deactivateDeviceToken(token) {
    try {
        await db_1.db.query('UPDATE device_tokens SET is_active = FALSE WHERE token = ?', [token]);
        console.log('✅ Token desactivado');
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error desactivando token:', error);
        return { success: false, error: String(error) };
    }
}
