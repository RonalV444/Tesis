import { Router, Request, Response } from "express";
import { memoryDB } from "../services/db";
import { 
  sendNotificationToUser, 
  registerDeviceToken, 
  deactivateDeviceToken,
  registerWebSubscription,   // <--- AGREGAR
  unregisterWebSubscription  // <--- AGREGAR
} from "../services/notifications";
import { sendPushNotificationFirebase } from "../services/firebase";
import { getPollingStatus } from "../services/sync";

const router = Router();

// ============ Helper para simular datos de Steve (en memoria) ============

// Datos simulados de Steve (estaciones de carga)
const simulatedChargePoints = [
  { id: "CP-001", name: "Cargador Norte", status: "Available", vendor: "Delta", model: "UFC-200", last_heartbeat: new Date().toISOString() },
  { id: "CP-002", name: "Cargador Sur", status: "Charging", vendor: "ABB", model: "Terra 54", last_heartbeat: new Date().toISOString() },
  { id: "CP-003", name: "Cargador Este", status: "Available", vendor: "Siemens", model: "VersiCharge", last_heartbeat: new Date().toISOString() },
];

// Datos simulados de transacciones
const simulatedTransactions = [
  { transaction_pk: 1, charge_box_id: "CP-001", idTag: "user-001", startTimestamp: new Date().toISOString(), chargeSeconds: 1800, status: "Active" },
  { transaction_pk: 2, charge_box_id: "CP-002", idTag: "user-002", startTimestamp: new Date().toISOString(), chargeSeconds: 3600, status: "Active" },
  { transaction_pk: 3, charge_box_id: "CP-003", idTag: "user-001", startTimestamp: new Date(Date.now() - 86400000).toISOString(), chargeSeconds: 7200, status: "Completed" },
];

// Datos simulados de usuarios
const simulatedUsers = [
  { idTag: "user-001", name: "Usuario Demo", email: "demo@evcs.com", balance: 25.50 },
  { idTag: "user-002", name: "Test User", email: "test@test.com", balance: 10.00 },
];

// Funciones simuladas de Steve
async function getAllChargePoints() {
  return simulatedChargePoints;
}

async function getChargePointById(id: string) {
  return simulatedChargePoints.find(cp => cp.id === id);
}

async function getAllTransactions(limit: number = 100) {
  return simulatedTransactions.slice(0, limit);
}

async function getTransactionsByChargePoint(cpId: string, limit: number = 50) {
  return simulatedTransactions.filter(tx => tx.charge_box_id === cpId).slice(0, limit);
}

async function getAllUsers() {
  return simulatedUsers;
}

async function getUserByTag(idTag: string) {
  return simulatedUsers.find(u => u.idTag === idTag);
}

async function getActiveTransactionByUser(idTag: string) {
  const tx = simulatedTransactions.find(t => t.idTag === idTag && t.status === "Active");
  if (!tx) return null;
  return {
    transaction_pk: tx.transaction_pk,
    idTag: tx.idTag,
    charge_box_id: tx.charge_box_id,
    startTimestamp: tx.startTimestamp,
    chargeSeconds: tx.chargeSeconds,
    connector_id: 1,
    charge_point_vendor: "Simulated",
    charge_point_model: "Demo",
    energyAtStart: "0"
  };
}

// ============ Health & Status ============

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), mode: "demo-memory" });
});

router.get("/polling/status", (req: Request, res: Response) => {
  res.json({ status: "active", mode: "demo", lastPoll: new Date().toISOString() });
});

// ============ Charge Points (simulados) ============

router.get("/charge-points", async (req: Request, res: Response) => {
  try {
    const chargePoints = await getAllChargePoints();
    res.json({ total: chargePoints.length, data: chargePoints });
  } catch (error) {
    console.error("Error fetching charge points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/charge-points/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chargePoint = await getChargePointById(id);
    if (!chargePoint) return res.status(404).json({ error: "Charge point not found" });
    res.json(chargePoint);
  } catch (error) {
    console.error("Error fetching charge point:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Transactions (simuladas) ============

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const transactions = await getAllTransactions(limit);
    res.json({ total: transactions.length, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/charge-points/:cpId/transactions", async (req: Request, res: Response) => {
  try {
    const { cpId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const transactions = await getTransactionsByChargePoint(cpId, limit);
    res.json({ chargePointId: cpId, total: transactions.length, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:idTag/current-charge", async (req: Request, res: Response) => {
  try {
    const { idTag } = req.params;
    const activeTransaction = await getActiveTransactionByUser(idTag);
    if (!activeTransaction) {
      return res.status(404).json({ error: "No active charging session", idTag });
    }

    const chargeTimeMinutes = Math.floor(activeTransaction.chargeSeconds / 60);
    const chargeTimeHours = (activeTransaction.chargeSeconds / 3600).toFixed(2);

    res.json({
      transactionId: activeTransaction.transaction_pk,
      userId: activeTransaction.idTag,
      chargePoint: {
        id: activeTransaction.charge_box_id,
        vendor: activeTransaction.charge_point_vendor,
        model: activeTransaction.charge_point_model,
        connector: activeTransaction.connector_id,
      },
      charging: {
        startTime: activeTransaction.startTimestamp,
        durationSeconds: activeTransaction.chargeSeconds,
        durationMinutes: chargeTimeMinutes,
        durationHours: parseFloat(chargeTimeHours),
      energyAtStart: parseFloat(activeTransaction.energyAtStart || "0"),
        estimatedRemaining: "See notifications for real-time progress",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching current charge state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Users (simulados) ============

router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json({ total: users.length, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:idTag", async (req: Request, res: Response) => {
  try {
    const { idTag } = req.params;
    const user = await getUserByTag(idTag);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Authentication (para app móvil) ============

// Login endpoint para la app móvil
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Buscar en memoryDB (de db.ts)
    const user = memoryDB.users.find(u => u.email === email && u.password === password);
    if (user) {
      res.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        token: "demo-token-" + Date.now()
      });
    } else {
      res.status(401).json({ success: false, message: "Credenciales inválidas. Use test@test.com / 123456" });
    }
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register user (simplificado)
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const existing = memoryDB.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    const newUser = {
      id: (memoryDB.users.length + 1).toString(),
      email,
      password,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    memoryDB.users.push(newUser);
    res.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Notificaciones (versión simplificada) ============

// Register device token for push notifications
router.post("/notifications/register-token", async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ error: "Missing required fields: userId, token" });
    }

    // Guardar en memoryDB
    const existing = memoryDB.deviceTokens.find(t => t.token === token);
    if (!existing) {
      memoryDB.deviceTokens.push({ userId, token, createdAt: new Date().toISOString() });
    }
    
    console.log(`✅ Token registrado para usuario ${userId}: ${token}`);
    res.json({ success: true, message: "Token registered successfully" });
  } catch (error) {
    console.error("Error registering token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Deactivate device token
router.delete("/notifications/register-token/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const index = memoryDB.deviceTokens.findIndex(t => t.token === token);
    if (index !== -1) {
      memoryDB.deviceTokens.splice(index, 1);
    }
    res.json({ success: true, message: "Token deactivated" });
  } catch (error) {
    console.error("Error deactivating token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send test notification (endpoint para pruebas manuales)
router.post("/notifications/send", async (req: Request, res: Response) => {
  try {
    const { title, body, token, userId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Missing required fields: title, body" });
    }

    let targetToken = token;
    if (userId && !targetToken) {
      // Buscar token del usuario en memoryDB
      const userToken = memoryDB.deviceTokens.find(t => t.userId === userId);
      targetToken = userToken?.token;
    }

    if (!targetToken) {
      return res.status(404).json({ error: "No device token found for user" });
    }

    const result = await sendPushNotificationFirebase({ title, body, token: targetToken });
    res.json({ success: result.success, messageId: result.messageId, error: result.error });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Notification Logs (usando memoryDB) ============

router.get("/notifications/logs", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = memoryDB.notifications.slice(0, limit);
    res.json({ total: logs.length, data: logs });
  } catch (error) {
    console.error("Error fetching notification logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications/logs/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const logs = memoryDB.notifications.filter(n => n.userId === userId);
    res.json({ userId, total: logs.length, data: logs });
  } catch (error) {
    console.error("Error fetching notification logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Transaction Events (usando memoryDB) ============

router.get("/events/transactions", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const events = memoryDB.transactions.slice(0, limit);
    res.json({ total: events.length, data: events });
  } catch (error) {
    console.error("Error fetching transaction events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ============ Web Subscriptions (para PWA) ============

// Registrar suscripción web (PWA)
router.post("/notifications/web-subscribe", async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ error: "Missing required fields: userId, subscription" });
    }
    
    const result = await registerWebSubscription({ userId, subscription });
    
    if (result.success) {
      res.json({ success: true, message: "Web subscription registered" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error registering web subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Eliminar suscripción web
router.delete("/notifications/web-subscribe", async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: "Missing endpoint" });
    }
    
    const result = await unregisterWebSubscription(endpoint);
    res.json({ success: result.success });
  } catch (error) {
    console.error("Error unregistering web subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;