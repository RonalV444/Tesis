"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOcppServer = createOcppServer;
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
// Use require to avoid strict TypeScript type errors from the external package
const { OcppServer } = require("@extrawest/node-ts-ocpp");
const env_1 = require("../config/env");
const db_1 = require("../services/db");
const notifications_1 = require("../services/notifications");
const connectedChargePoints = new Map();
function createOcppServer() {
    console.log('[OCPP] Iniciando createOcppServer...');
    const PORT = env_1.config.ocppPort;
    const httpServer = http_1.default.createServer();
    const wss = new ws_1.WebSocketServer({ noServer: true });
    // Try to obtain the central system constructor from the package
    const centralSystem = new OcppServer();
    // Handle new WebSocket connections
    httpServer.on("upgrade", (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
            const cpId = req.url?.split("/").pop() || `CP-${Date.now()}`;
            console.log("🔌 Charge Point conectado:", cpId);
            centralSystem.addConnection(cpId, ws);
            connectedChargePoints.set(cpId, { cpId });
            // Handle connection close
            ws.on("close", async () => {
                console.log("❌ Charge Point desconectado:", cpId);
                connectedChargePoints.delete(cpId);
                // Update charge point status in DB
                try {
                    await db_1.db.query(`UPDATE charge_points SET status = 'Unavailable' WHERE id = ?`, [cpId]);
                }
                catch (error) {
                    console.error(`Error updating charge point ${cpId} status:`, error);
                }
            });
            centralSystem.handleRequest(cpId, async (command, payload) => {
                console.log(`📩 Mensaje recibido de ${cpId}:`, command);
                // command is typically a string like 'BootNotification', 'StartTransaction', etc.
                switch (String(command)) {
                    case 'BootNotification':
                        return handleBootNotification(cpId, payload);
                    case 'StartTransaction':
                        return await handleStartTransaction(cpId, payload);
                    case 'StopTransaction':
                        return await handleStopTransaction(cpId, payload);
                    case 'Heartbeat':
                        return handleHeartbeat(cpId, payload);
                    default:
                        console.log("⚠️ Acción no manejada:", command);
                        return {};
                }
            });
        });
    });
    httpServer.listen(PORT, () => {
        console.log(`🚀 OCPP 2.0.1 escuchando en ws://localhost:${PORT}/ocpp/`);
        console.log('[OCPP] createOcppServer finalizado.');
    });
}
function handleBootNotification(cpId, boot) {
    console.log("➡️ BootNotification:", boot);
    // Store charge point info
    const cpInfo = connectedChargePoints.get(cpId) || { cpId };
    cpInfo.chargePointVendor = boot.chargePointVendor;
    cpInfo.chargePointModel = boot.chargePointModel;
    cpInfo.firmwareVersion = boot.firmwareVersion;
    cpInfo.serialNumber = boot.chargePointSerialNumber;
    cpInfo.imsi = boot.imsi;
    cpInfo.iccid = boot.iccid;
    connectedChargePoints.set(cpId, cpInfo);
    // Save/update charge point in database
    db_1.db.query(`INSERT INTO charge_points (id, name, status) VALUES (?, ?, 'Available')
     ON DUPLICATE KEY UPDATE last_heartbeat = CURRENT_TIMESTAMP, status = 'Available'`, [cpId, boot.chargePointModel || cpId]).catch(error => console.error(`Error saving charge point ${cpId}:`, error));
    const bootResponse = {
        currentTime: new Date().toISOString(),
        interval: 300, // Heartbeat every 5 minutes
        status: "Accepted",
    };
    console.log(`✅ BootNotification aceptado para ${cpId}`);
    return bootResponse;
}
async function handleStartTransaction(cpId, start) {
    console.log("⚡ StartTransaction:", start);
    const transactionId = Math.floor(Math.random() * 999999);
    try {
        // Insert transaction into database
        const [result] = await db_1.db.query(`INSERT INTO transactions (charge_point_id, user_id, status) 
       VALUES (?, ?, 'Active')`, [cpId, start.idTag || null]);
        console.log(`✅ Transacción iniciada: ID ${transactionId} en ${cpId}`);
        // Send notification if user_id available
        if (start.idTag) {
            (0, notifications_1.sendNotificationToUser)({
                userId: start.idTag,
                title: "Carga iniciada",
                body: `Tu sesión de carga ha comenzado en ${cpId}`
            }).catch(error => console.error("Error sending notification:", error));
        }
        return { transactionId };
    }
    catch (error) {
        console.error("Error handling StartTransaction:", error);
        return { transactionId };
    }
}
async function handleStopTransaction(cpId, stop) {
    console.log("⛔ StopTransaction:", stop);
    try {
        // Update transaction
        const [result] = await db_1.db.query(`UPDATE transactions 
       SET stop_time = CURRENT_TIMESTAMP, status = 'Completed', 
           energy_delivered = ? 
       WHERE charge_point_id = ? AND status = 'Active'
       ORDER BY start_time DESC LIMIT 1`, [stop.meterStop ? (stop.meterStop / 1000) : 0, cpId]);
        console.log(`✅ Transacción completada en ${cpId}`);
        // Send notification
        if (stop.idTag) {
            (0, notifications_1.sendNotificationToUser)({
                userId: stop.idTag,
                title: "Carga completada",
                body: `Tu sesión de carga ha finalizado. Energía: ${stop.meterStop ? (stop.meterStop / 1000).toFixed(2) + ' kWh' : 'N/A'}`
            }).catch(error => console.error("Error sending notification:", error));
        }
        return {};
    }
    catch (error) {
        console.error("Error handling StopTransaction:", error);
        return {};
    }
}
function handleHeartbeat(cpId, heartbeat) {
    console.log(`💓 Heartbeat recibido de ${cpId}`);
    // Update last heartbeat in database
    db_1.db.query(`UPDATE charge_points SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?`, [cpId]).catch(error => console.error(`Error updating heartbeat for ${cpId}:`, error));
    return {
        currentTime: new Date().toISOString(),
    };
}
