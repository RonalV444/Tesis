"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../config/env");
exports.db = promise_1.default.createPool({
    host: env_1.config.db.host,
    user: env_1.config.db.user,
    password: env_1.config.db.password,
    database: env_1.config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});
// Test connection on startup
exports.db.getConnection()
    .then((conn) => {
    console.log('✅ Database pool initialized successfully');
    conn.release();
})
    .catch((error) => {
    console.error('❌ Failed to initialize database pool:', error);
});
