import http from "http";
import { WebSocketServer } from "ws";
const { OcppServer } = require("@extrawest/node-ts-ocpp");
import { config } from "../config/env";
import { db, memoryDB } from "../services/db";
import { sendNotificationToUser } from "../services/notifications";
import { ruleEngine, OcppEvent } from "../services/ruleEngine";

interface ChargePointInfo {
  cpId: string;
  chargePointVendor?: string;
  chargePointModel?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  imsi?: string;
  iccid?: string;
}

const connectedChargePoints: Map<string, ChargePointInfo> = new Map();

export function createOcppServer(): void {
  console.log('[OCPP] Iniciando createOcppServer...');
  const PORT = config.ocppPort;
  const httpServer = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  const centralSystem: any = new OcppServer();

  httpServer.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      const cpId = req.url?.split("/").pop() || `CP-${Date.now()}`;
      console.log("🔌 Charge Point conectado:", cpId);
      centralSystem.addConnection(cpId, ws);
      connectedChargePoints.set(cpId, { cpId });

      ws.on("close", async () => {
        console.log("❌ Charge Point desconectado:", cpId);
        connectedChargePoints.delete(cpId);
        const cp = memoryDB.chargePoints.find(c => c.id === cpId);
        if (cp) cp.status = 'Unavailable';
      });

      centralSystem.handleRequest(cpId, async (command: any, payload: any) => {
        console.log(`📩 Mensaje recibido de ${cpId}:`, command);
        switch (String(command)) {
          case 'BootNotification':
            return handleBootNotification(cpId, payload);
          case 'StartTransaction':
            return await handleStartTransaction(cpId, payload);
          case 'StopTransaction':
            return await handleStopTransaction(cpId, payload);
          case 'StatusNotification':
            return await handleStatusNotification(cpId, payload);
          case 'MeterValues':
            return await handleMeterValues(cpId, payload);
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

function handleBootNotification(cpId: string, boot: any): any {
  console.log("➡️ BootNotification:", boot);
  const cpInfo = connectedChargePoints.get(cpId) || { cpId };
  cpInfo.chargePointVendor = boot.chargePointVendor;
  cpInfo.chargePointModel = boot.chargePointModel;
  cpInfo.firmwareVersion = boot.firmwareVersion;
  cpInfo.serialNumber = boot.chargePointSerialNumber;
  connectedChargePoints.set(cpId, cpInfo);
  
  const existingCp = memoryDB.chargePoints.find(c => c.id === cpId);
  if (!existingCp) {
    memoryDB.chargePoints.push({ id: cpId, name: boot.chargePointModel || cpId, status: 'Available', last_heartbeat: new Date() });
  } else {
    existingCp.status = 'Available';
    existingCp.last_heartbeat = new Date();
  }
  
  return { currentTime: new Date().toISOString(), interval: 300, status: "Accepted" };
}

async function handleStartTransaction(cpId: string, start: any): Promise<any> {
  console.log("⚡ StartTransaction:", start);
  const transactionId = Math.floor(Math.random() * 999999);
  const userId = start.idTag || 'anonymous';
  
  memoryDB.transactions.push({
    id: transactionId,
    charge_point_id: cpId,
    user_id: userId,
    status: 'Active',
    start_time: new Date().toISOString()
  });
  
  console.log(`✅ Transacción iniciada: ID ${transactionId} en ${cpId}`);
  
  const event: OcppEvent = {
    transactionId: transactionId.toString(),
    chargePointId: cpId,
    userId: userId,
    eventType: 'StartTransaction',
    timestamp: new Date().toISOString(),
  };
  
  const notification = ruleEngine.evaluate(event);
  if (notification && userId !== 'anonymous') {
    await sendNotificationToUser({
      userId: userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }).catch(error => console.error("Error sending notification:", error));
  }
  
  return { transactionId };
}

async function handleStopTransaction(cpId: string, stop: any): Promise<any> {
  console.log("⛔ StopTransaction:", stop);
  
  const transaction = memoryDB.transactions.find(tx => tx.charge_point_id === cpId && tx.status === 'Active');
  if (transaction) {
    transaction.status = 'Completed';
    transaction.stop_time = new Date().toISOString();
    transaction.energy_delivered = stop.meterStop ? (stop.meterStop / 1000) : 0;
  }
  
  console.log(`✅ Transacción completada en ${cpId}`);
  
  const event: OcppEvent = {
    chargePointId: cpId,
    userId: stop.idTag || 'anonymous',
    eventType: 'StopTransaction',
    status: 'Finishing',
    timestamp: new Date().toISOString(),
  };
  
  const notification = ruleEngine.evaluate(event);
  
  if (stop.idTag) {
    const finalTitle = notification?.title || "✨ Carga finalizada";
    const finalBody = notification?.body || `Tu sesión de carga ha finalizado. Energía: ${stop.meterStop ? (stop.meterStop / 1000).toFixed(2) + ' kWh' : 'N/A'}`;
    await sendNotificationToUser({
      userId: stop.idTag,
      title: finalTitle,
      body: finalBody,
      data: notification?.data || { chargePointId: cpId },
    }).catch(error => console.error("Error sending notification:", error));
  }
  
  return {};
}

function handleHeartbeat(cpId: string, heartbeat: any): any {
  console.log(`💓 Heartbeat recibido de ${cpId}`);
  const cp = memoryDB.chargePoints.find(c => c.id === cpId);
  if (cp) cp.last_heartbeat = new Date();
  return { currentTime: new Date().toISOString() };
}

async function handleStatusNotification(cpId: string, status: any): Promise<any> {
  console.log("📊 StatusNotification:", status);
  const event: OcppEvent = {
    chargePointId: cpId,
    userId: 'system',
    eventType: 'StatusNotification',
    status: status.connectorStatus,
    timestamp: new Date().toISOString(),
  };
  const notification = ruleEngine.evaluate(event);
  if (notification && notification.shouldNotify) {
    console.log(`[StatusNotification] Notificación disparada: ${notification.ruleTriggered}`);
  }
  return {};
}

async function handleMeterValues(cpId: string, meterData: any): Promise<any> {
  console.log("📈 MeterValues:", meterData);
  let soc: number | undefined;
  let power: number | undefined;
  
  if (Array.isArray(meterData.sampledValue)) {
    for (const sample of meterData.sampledValue) {
      if (sample.measurand === 'SoC') soc = parseFloat(sample.value);
      else if (sample.measurand === 'Power.Active.Import.Register') power = parseFloat(sample.value);
    }
  }
  
  const transaction = memoryDB.transactions.find(tx => tx.charge_point_id === cpId && tx.status === 'Active');
  if (!transaction) {
    console.log("⚠️ No active transaction found for meter values");
    return {};
  }
  
  const userId = transaction.user_id || 'anonymous';
  
  const event: OcppEvent = {
    transactionId: transaction.id.toString(),
    chargePointId: cpId,
    userId: userId,
    eventType: 'MeterValues',
    soc: soc,
    power: power,
    timestamp: new Date().toISOString(),
  };
  
  const notification = ruleEngine.evaluate(event);
  if (notification && notification.shouldNotify && userId !== 'anonymous') {
    await sendNotificationToUser({
      userId: userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }).catch(error => console.error("Error sending notification:", error));
    console.log(`[MeterValues] Notificación enviada: ${notification.ruleTriggered}`);
  }
  
  return {};
}