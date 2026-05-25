"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.steveDb = void 0;
exports.getAllChargePoints = getAllChargePoints;
exports.getChargePointById = getChargePointById;
exports.getActiveTransactions = getActiveTransactions;
exports.getAllTransactions = getAllTransactions;
exports.getTransactionsByChargePoint = getTransactionsByChargePoint;
exports.getUserByTag = getUserByTag;
exports.getAllUsers = getAllUsers;
exports.getUsersInTransaction = getUsersInTransaction;
exports.getActiveTransactionByUser = getActiveTransactionByUser;
exports.getTransactionMeterValues = getTransactionMeterValues;
exports.getChargePointStatusUpdates = getChargePointStatusUpdates;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../config/env");
// Conexión a Steve DB
exports.steveDb = promise_1.default.createPool({
    host: env_1.config.steveDb.host,
    user: env_1.config.steveDb.user,
    password: env_1.config.steveDb.password,
    database: env_1.config.steveDb.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});
// Inicializar conexión
exports.steveDb.getConnection()
    .then((conn) => {
    console.log('✅ Steve database pool initialized successfully');
    conn.release();
})
    .catch((error) => {
    console.error('❌ Failed to initialize Steve database pool:', error);
});
// Service Functions
/**
 * Get all charge points from Steve
 */
async function getAllChargePoints() {
    try {
        const [rows] = await exports.steveDb.query('SELECT * FROM charge_box');
        return rows;
    }
    catch (error) {
        console.error('Error fetching charge points from Steve:', error);
        return [];
    }
}
/**
 * Get charge point by ID
 */
async function getChargePointById(chargeBoxId) {
    try {
        const [rows] = await exports.steveDb.query('SELECT * FROM charge_box WHERE charge_box_id = ?', [chargeBoxId]);
        const result = rows;
        return result.length > 0 ? result[0] : null;
    }
    catch (error) {
        console.error(`Error fetching charge point ${chargeBoxId}:`, error);
        return null;
    }
}
/**
 * Get all active transactions
 */
async function getActiveTransactions() {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT 
        ts.transaction_pk,
        ts.connector_pk,
        ts.id_tag AS idTag,
        ts.start_timestamp AS startTimestamp,
        ts.start_value AS startValue,
        COALESCE(tst.stop_timestamp, NULL) AS stopTimestamp,
        COALESCE(tst.stop_value, NULL) AS stopValue,
        c.charge_box_id
      FROM transaction_start ts
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      JOIN connector c ON ts.connector_pk = c.connector_pk
      WHERE tst.transaction_pk IS NULL
      ORDER BY ts.start_timestamp DESC
    `);
        return rows;
    }
    catch (error) {
        console.error('Error fetching active transactions:', error);
        return [];
    }
}
/**
 * Get all transactions (completed and active)
 */
async function getAllTransactions(limit = 100) {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT 
        ts.transaction_pk,
        ts.connector_pk,
        ts.id_tag AS idTag,
        ts.start_timestamp AS startTimestamp,
        ts.start_value AS startValue,
        COALESCE(tst.stop_timestamp, NULL) AS stopTimestamp,
        COALESCE(tst.stop_value, NULL) AS stopValue,
        c.charge_box_id
      FROM transaction_start ts
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      JOIN connector c ON ts.connector_pk = c.connector_pk
      ORDER BY ts.start_timestamp DESC
      LIMIT ?
    `, [limit]);
        return rows;
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}
/**
 * Get transactions for a specific charge point
 */
async function getTransactionsByChargePoint(chargeBoxId, limit = 50) {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT 
        ts.transaction_pk,
        ts.connector_pk,
        ts.id_tag AS idTag,
        ts.start_timestamp AS startTimestamp,
        ts.start_value AS startValue,
        COALESCE(tst.stop_timestamp, NULL) AS stopTimestamp,
        COALESCE(tst.stop_value, NULL) AS stopValue,
        c.charge_box_id
      FROM transaction_start ts
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      JOIN connector c ON ts.connector_pk = c.connector_pk
      WHERE c.charge_box_id = ?
      ORDER BY ts.start_timestamp DESC
      LIMIT ?
    `, [chargeBoxId, limit]);
        return rows;
    }
    catch (error) {
        console.error(`Error fetching transactions for ${chargeBoxId}:`, error);
        return [];
    }
}
/**
 * Get user by RFID tag (from ocpp_tag)
 */
async function getUserByTag(idTag) {
    try {
        const [rows] = await exports.steveDb.query('SELECT ocpp_tag_pk, id_tag, note FROM ocpp_tag WHERE id_tag = ?', [idTag]);
        const result = rows;
        if (result.length > 0) {
            return {
                user_pk: result[0].ocpp_tag_pk,
                idTag: result[0].id_tag,
                firstName: undefined,
                lastName: undefined,
                email: undefined,
                phone: undefined,
                inTransaction: false,
            };
        }
        return null;
    }
    catch (error) {
        console.error(`Error fetching user ${idTag}:`, error);
        return null;
    }
}
/**
 * Get all users from ocpp_tag
 */
async function getAllUsers() {
    try {
        const [rows] = await exports.steveDb.query('SELECT ocpp_tag_pk, id_tag FROM ocpp_tag');
        return rows.map(row => ({
            user_pk: row.ocpp_tag_pk,
            idTag: row.id_tag,
            firstName: undefined,
            lastName: undefined,
            email: undefined,
            phone: undefined,
            inTransaction: false,
        }));
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}
/**
 * Get users currently in transaction
 */
async function getUsersInTransaction() {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT DISTINCT ot.ocpp_tag_pk, ot.id_tag
      FROM ocpp_tag ot
      JOIN transaction_start ts ON ot.id_tag = ts.id_tag
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      WHERE tst.transaction_pk IS NULL
      LIMIT 100
    `);
        return rows.map(row => ({
            user_pk: row.ocpp_tag_pk,
            idTag: row.id_tag,
            firstName: undefined,
            lastName: undefined,
            email: undefined,
            phone: undefined,
            inTransaction: true,
        }));
    }
    catch (error) {
        console.error('Error fetching users in transaction:', error);
        return [];
    }
}
/**
 * Get active transaction for a specific user
 */
async function getActiveTransactionByUser(idTag) {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT 
        ts.transaction_pk,
        ts.connector_pk,
        ts.id_tag AS idTag,
        ts.start_timestamp AS startTimestamp,
        ts.start_value AS startValue,
        c.charge_box_id,
        cb.charge_point_vendor,
        cb.charge_point_model,
        c.connector_id,
        TIMESTAMPDIFF(SECOND, ts.start_timestamp, NOW()) as chargeSeconds,
        IFNULL(ts.start_value, 0) as energyAtStart
      FROM transaction_start ts
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      JOIN connector c ON ts.connector_pk = c.connector_pk
      JOIN charge_box cb ON c.charge_box_id = cb.charge_box_id
      WHERE ts.id_tag = ? AND tst.transaction_pk IS NULL
      LIMIT 1
    `, [idTag]);
        return rows.length > 0 ? rows[0] : null;
    }
    catch (error) {
        console.error(`Error fetching active transaction for user ${idTag}:`, error);
        return null;
    }
}
/**
 * Get meter values for a transaction (currently not used)
 */
async function getTransactionMeterValues(transactionPk) {
    // Currently disabled - meter values table structure unclear
    // TODO: Implement when Steve DB schema is clarified
    return [];
}
/**
 * Get recent status updates for a charge point
 */
async function getChargePointStatusUpdates(chargeBoxId, minutes = 60) {
    try {
        const [rows] = await exports.steveDb.query(`
      SELECT 
        cs.connector_pk,
        cs.status,
        cs.timestamp,
        c.connector_id
      FROM connector_status cs
      JOIN connector c ON cs.connector_pk = c.connector_pk
      WHERE c.charge_box_id = ? 
        AND cs.timestamp > DATE_SUB(NOW(), INTERVAL ? MINUTE)
      ORDER BY cs.timestamp DESC
    `, [chargeBoxId, minutes]);
        return rows;
    }
    catch (error) {
        console.error('Error fetching status updates:', error);
        return [];
    }
}
