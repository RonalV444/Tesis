import mysql from 'mysql2/promise';
import { config } from '../config/env';

// Conexión a Steve DB
export const steveDb = mysql.createPool({
  host: config.steveDb.host,
  user: config.steveDb.user,
  password: config.steveDb.password,
  database: config.steveDb.database,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Inicializar conexión
steveDb.getConnection()
  .then((conn) => {
    console.log('✅ Steve database pool initialized successfully');
    conn.release();
  })
  .catch((error) => {
    console.error('❌ Failed to initialize Steve database pool:', error);
  });

// Interfaces
export interface SteveChargePoint {
  charge_box_pk: number;
  charge_box_id: string;
  charge_point_vendor?: string;
  charge_point_model?: string;
  fw_version?: string;
  registration_status: string;
  last_heartbeat_timestamp?: string;
  location_latitude?: number;
  location_longitude?: number;
}

export interface SteveTransaction {
  transaction_pk: number;
  connector_pk: number;
  idTag: string;
  startTimestamp: string;
  startValue?: string;
  stopTimestamp?: string;
  stopValue?: string;
  charge_box_id?: string;
}

export interface SteveUser {
  user_pk: number;
  idTag: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  inTransaction: boolean;
}

// Service Functions

/**
 * Get all charge points from Steve
 */
export async function getAllChargePoints(): Promise<SteveChargePoint[]> {
  try {
    const [rows] = await steveDb.query('SELECT * FROM charge_box');
    return rows as SteveChargePoint[];
  } catch (error) {
    console.error('Error fetching charge points from Steve:', error);
    return [];
  }
}

/**
 * Get charge point by ID
 */
export async function getChargePointById(chargeBoxId: string): Promise<SteveChargePoint | null> {
  try {
    const [rows] = await steveDb.query(
      'SELECT * FROM charge_box WHERE charge_box_id = ?',
      [chargeBoxId]
    );
    const result = rows as SteveChargePoint[];
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error fetching charge point ${chargeBoxId}:`, error);
    return null;
  }
}

/**
 * Get all active transactions
 */
export async function getActiveTransactions(): Promise<SteveTransaction[]> {
  try {
    const [rows] = await steveDb.query(`
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
    return rows as SteveTransaction[];
  } catch (error) {
    console.error('Error fetching active transactions:', error);
    return [];
  }
}

/**
 * Get all transactions (completed and active)
 */
export async function getAllTransactions(limit: number = 100): Promise<SteveTransaction[]> {
  try {
    const [rows] = await steveDb.query(`
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
    return rows as SteveTransaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Get transactions for a specific charge point
 */
export async function getTransactionsByChargePoint(
  chargeBoxId: string,
  limit: number = 50
): Promise<SteveTransaction[]> {
  try {
    const [rows] = await steveDb.query(`
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
    return rows as SteveTransaction[];
  } catch (error) {
    console.error(`Error fetching transactions for ${chargeBoxId}:`, error);
    return [];
  }
}

/**
 * Get user by RFID tag (from ocpp_tag)
 */
export async function getUserByTag(idTag: string): Promise<SteveUser | null> {
  try {
    const [rows] = await steveDb.query(
      'SELECT ocpp_tag_pk, id_tag, note FROM ocpp_tag WHERE id_tag = ?',
      [idTag]
    );
    const result = rows as any[];
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
  } catch (error) {
    console.error(`Error fetching user ${idTag}:`, error);
    return null;
  }
}

/**
 * Get all users from ocpp_tag
 */
export async function getAllUsers(): Promise<SteveUser[]> {
  try {
    const [rows] = await steveDb.query(
      'SELECT ocpp_tag_pk, id_tag FROM ocpp_tag'
    );
    return (rows as any[]).map(row => ({
      user_pk: row.ocpp_tag_pk,
      idTag: row.id_tag,
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      phone: undefined,
      inTransaction: false,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get users currently in transaction
 */
export async function getUsersInTransaction(): Promise<SteveUser[]> {
  try {
    const [rows] = await steveDb.query(`
      SELECT DISTINCT ot.ocpp_tag_pk, ot.id_tag
      FROM ocpp_tag ot
      JOIN transaction_start ts ON ot.id_tag = ts.id_tag
      LEFT JOIN transaction_stop tst ON ts.transaction_pk = tst.transaction_pk
      WHERE tst.transaction_pk IS NULL
      LIMIT 100
    `);
    return (rows as any[]).map(row => ({
      user_pk: row.ocpp_tag_pk,
      idTag: row.id_tag,
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      phone: undefined,
      inTransaction: true,
    }));
  } catch (error) {
    console.error('Error fetching users in transaction:', error);
    return [];
  }
}

/**
 * Get active transaction for a specific user
 */
export async function getActiveTransactionByUser(idTag: string): Promise<any | null> {
  try {
    const [rows] = await steveDb.query(`
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
    
    return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
  } catch (error) {
    console.error(`Error fetching active transaction for user ${idTag}:`, error);
    return null;
  }
}

/**
 * Get meter values for a transaction (currently not used)
 */
export async function getTransactionMeterValues(transactionPk: number) {
  // Currently disabled - meter values table structure unclear
  // TODO: Implement when Steve DB schema is clarified
  return [];
}

/**
 * Get recent status updates for a charge point
 */
export async function getChargePointStatusUpdates(chargeBoxId: string, minutes: number = 60) {
  try {
    const [rows] = await steveDb.query(`
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
  } catch (error) {
    console.error('Error fetching status updates:', error);
    return [];
  }
}
