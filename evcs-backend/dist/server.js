"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('🟢 [DEBUG] server.ts iniciado');
const express_1 = __importDefault(require("express"));
const index_1 = require("./ocpp/index"); // <- IMPORTANTE: .js
const db_1 = require("./services/db");
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./api/routes"));
const sync_1 = require("./services/sync");
const firebase_1 = require("./services/firebase");
// Startup debug
console.log('🔧 Starting EVCS Backend (dev)');
console.log(`PORT=${process.env.PORT || 'unset'}; OCPP_PORT=${process.env.OCPP_PORT || 'unset'}`);
console.log(`Using Steve DB host: ${process.env.STEVE_DB_HOST || 'unset'}`);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("EVCS Backend OK");
});
// API Routes
app.use("/api", routes_1.default);
async function testDBConnection() {
    try {
        await db_1.db.query('SELECT 1');
        console.log('✅ Conexión exitosa a MySQL (evcs_db)');
    }
    catch (e) {
        console.error('❌ Error de conexión a MySQL:', e);
    }
}
testDBConnection();
// Initialize Firebase Admin SDK
try {
    (0, firebase_1.initializeFirebase)();
    console.log('✅ Firebase Admin SDK inicializado');
}
catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    process.exit(1);
}
const PORT = env_1.config.port;
// Initialize transaction polling
(0, sync_1.initializePolling)();
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    (0, sync_1.stopPolling)();
    process.exit(0);
});
// Initialize OCPP server (non-blocking)
(0, index_1.createOcppServer)();
// Start API server
app.listen(PORT, () => {
    console.log(`🚀 API listening on port ${PORT}`);
    console.log(`📍 API routes available at http://localhost:${PORT}/api`);
});
