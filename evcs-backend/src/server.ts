console.log('🟢 [DEBUG] server.ts iniciado');
import express, { Request, Response } from "express";
import cors from "cors";  // <-- AGREGAR ESTA LÍNEA

import { createOcppServer } from "./ocpp/index";
import { db } from "./services/db";
import { config } from "./config/env";
import apiRoutes from "./api/routes";
import { initializePolling, stopPolling } from "./services/sync";
import { initializeFirebase } from "./services/firebase";

// Startup debug
console.log('🔧 Starting EVCS Backend (dev)');
console.log(`PORT=${process.env.PORT || 'unset'}; OCPP_PORT=${process.env.OCPP_PORT || 'unset'}`);
console.log(`Using Steve DB host: ${process.env.STEVE_DB_HOST || 'unset'}`);

const app = express();
app.use(cors());        // <-- AGREGAR ESTA LÍNEA (ANTES de express.json)
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("EVCS Backend OK");
});

// API Routes
app.use("/api", apiRoutes);

async function testDBConnection() {
  try {
    await db.query('SELECT 1');
    console.log('✅ Conexión exitosa a MySQL (evcs_db)');
  } catch (e) {
    console.error('❌ Error de conexión a MySQL:', e);
  }
}

testDBConnection();

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
  console.log('✅ Firebase Admin SDK inicializado');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  process.exit(1);
}

const PORT = config.port;

// Initialize transaction polling
initializePolling();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  stopPolling();
  process.exit(0);
});

// Initialize OCPP server (non-blocking)
createOcppServer();

// Start API server (escucha en todas las interfaces)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API listening on port ${PORT}`);
  console.log(`📍 API routes available at http://localhost:${PORT}/api`);
  console.log(`📍 Network access: http://10.125.19.125:${PORT}/api`);
});