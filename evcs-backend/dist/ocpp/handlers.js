"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBootNotification = handleBootNotification;
exports.handleStartStop = handleStartStop;
const firebase_1 = require("../services/firebase");
async function handleBootNotification(chargePointId, payload) {
    console.log("BootNotification from", chargePointId, payload);
    // responder con currentTime, interval y status
    return {
        currentTime: new Date().toISOString(),
        interval: 60,
        status: "Accepted"
    };
}
async function handleStartStop(chargePointId, type, payload) {
    console.log(`${type} transaction from`, chargePointId, payload);
    // -----  Ejemplo de llamado a FCM (reemplaza luego esto por lógica real) -----
    // Debes tener el token del dispositivo destino. Aquí simulado.
    const testDeviceToken = "TOKEN_DE_EJEMPLO_DE_APP";
    if (type === "start") {
        await (0, firebase_1.sendPushNotificationFirebase)({
            title: "Carga iniciada",
            body: `La estación ${chargePointId} inició una sesión de carga.`,
            token: testDeviceToken,
        });
    }
    else if (type === "stop") {
        await (0, firebase_1.sendPushNotificationFirebase)({
            title: "Carga finalizada",
            body: `La estación ${chargePointId} finalizó una sesión de carga.`,
            token: testDeviceToken,
        });
    }
    // --------------------------------------------------------------------------
    // Aquí guardas en BD, generas evento para la app, etc.
    return {
        transactionId: Math.floor(Math.random() * 100000)
    };
}
