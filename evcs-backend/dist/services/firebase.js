"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
exports.initializeFirebase = initializeFirebase;
exports.sendPushNotificationFirebase = sendPushNotificationFirebase;
exports.sendMulticastNotification = sendMulticastNotification;
exports.subscribeToTopic = subscribeToTopic;
exports.isValidToken = isValidToken;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const env_1 = require("../config/env");
/**
 * Inicializar Firebase Admin SDK
 * Requiere: archivo de credenciales en FIREBASE_CREDENTIALS_PATH
 */
let firebaseApp = null;
function initializeFirebase() {
    if (firebaseApp) {
        console.log('✅ Firebase ya inicializado');
        return firebaseApp;
    }
    try {
        const credentialsPath = env_1.config.firebase.credentialsPath;
        if (!credentialsPath) {
            throw new Error('FIREBASE_CREDENTIALS_PATH no configurado');
        }
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(credentialsPath),
        });
        console.log('✅ Firebase Admin SDK inicializado correctamente');
        return firebaseApp;
    }
    catch (error) {
        console.error('❌ Error inicializando Firebase Admin SDK:', error);
        throw error;
    }
}
/**
 * Enviar notificación push usando Firebase Admin SDK
 */
async function sendPushNotificationFirebase({ title, body, token, data = {}, }) {
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
        const response = await firebase_admin_1.default.messaging().send(message);
        console.log('✅ Notificación enviada exitosamente:', response);
        return {
            success: true,
            messageId: response,
        };
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
 * Enviar notificación a múltiples dispositivos
 */
async function sendMulticastNotification({ title, body, tokens, data = {}, }) {
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
                const response = await firebase_admin_1.default.messaging().send({
                    ...message,
                    token,
                });
                results.push({ token, success: true, messageId: response });
                successCount++;
            }
            catch (error) {
                results.push({ token, success: false, error: String(error) });
                failureCount++;
            }
        }
        console.log(`✅ Notificaciones enviadas: ${successCount}/${tokens.length}`);
        if (failureCount > 0) {
            console.warn(`⚠️ Fallos: ${failureCount}`);
            results.forEach((resp) => {
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
    }
    catch (error) {
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
async function subscribeToTopic(tokens, topic) {
    if (!firebaseApp) {
        initializeFirebase();
    }
    try {
        const response = await firebase_admin_1.default.messaging().subscribeToTopic(tokens, topic);
        console.log(`✅ Tokens suscritos al tema "${topic}"`);
        return {
            success: true,
            successCount: response.successCount,
        };
    }
    catch (error) {
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
async function isValidToken(token) {
    if (!firebaseApp) {
        initializeFirebase();
    }
    try {
        // Intentar enviar un mensaje de prueba
        await firebase_admin_1.default.messaging().send({
            token,
            data: { test: 'true' },
        });
        return true;
    }
    catch (error) {
        console.warn('⚠️ Token inválido o expirado:', token);
        return false;
    }
}
