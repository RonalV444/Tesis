"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../services/db");
const notifications_1 = require("../services/notifications");
const firebase_1 = require("../services/firebase");
const steve_1 = require("../services/steve");
const sync_1 = require("../services/sync");
const router = (0, express_1.Router)();
// ============ Health & Status ============
// Health check
router.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Polling status
router.get("/polling/status", (req, res) => {
    res.json((0, sync_1.getPollingStatus)());
});
// ============ Charge Points (from Steve) ============
// Get all charge points from Steve
router.get("/charge-points", async (req, res) => {
    try {
        const chargePoints = await (0, steve_1.getAllChargePoints)();
        res.json({
            total: chargePoints.length,
            data: chargePoints,
        });
    }
    catch (error) {
        console.error("Error fetching charge points:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get specific charge point from Steve
router.get("/charge-points/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const chargePoint = await (0, steve_1.getChargePointById)(id);
        if (!chargePoint) {
            return res.status(404).json({ error: "Charge point not found" });
        }
        res.json(chargePoint);
    }
    catch (error) {
        console.error("Error fetching charge point:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ============ Transactions (from Steve) ============
// Get all transactions from Steve
router.get("/transactions", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const transactions = await (0, steve_1.getAllTransactions)(limit);
        res.json({
            total: transactions.length,
            data: transactions,
        });
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get transactions for specific charge point from Steve
router.get("/charge-points/:cpId/transactions", async (req, res) => {
    try {
        const { cpId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const transactions = await (0, steve_1.getTransactionsByChargePoint)(cpId, limit);
        res.json({
            chargePointId: cpId,
            total: transactions.length,
            data: transactions,
        });
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get current charging state for a user
router.get("/users/:idTag/current-charge", async (req, res) => {
    try {
        const { idTag } = req.params;
        const activeTransaction = await (0, steve_1.getActiveTransactionByUser)(idTag);
        if (!activeTransaction) {
            return res.status(404).json({
                error: "No active charging session",
                idTag
            });
        }
        // Calculate charge progress
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
                energyAtStart: parseFloat(activeTransaction.energyAtStart || 0),
                estimatedRemaining: "See notifications for real-time progress",
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error fetching current charge state:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ============ Users (from Steve) ============
// Get all users from Steve
router.get("/users", async (req, res) => {
    try {
        const users = await (0, steve_1.getAllUsers)();
        res.json({
            total: users.length,
            data: users,
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get specific user from Steve
router.get("/users/:idTag", async (req, res) => {
    try {
        const { idTag } = req.params;
        const user = await (0, steve_1.getUserByTag)(idTag);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ============ Notifications ============
// Register device token for push notifications
router.post("/notifications/register-token", async (req, res) => {
    try {
        const { userId, token } = req.body;
        if (!userId || !token) {
            return res.status(400).json({
                error: "Missing required fields: userId, token",
            });
        }
        const result = await (0, notifications_1.registerDeviceToken)({ userId, token });
        if (result.success) {
            res.status(201).json({
                message: result.message,
            });
        }
        else {
            res.status(500).json({
                error: result.error || "Failed to register token",
            });
        }
    }
    catch (error) {
        console.error("Error registering token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Send test notification
router.post("/notifications/send", async (req, res) => {
    try {
        const { title, body, token } = req.body;
        if (!title || !body || !token) {
            return res.status(400).json({
                error: "Missing required fields: title, body, token",
            });
        }
        const result = await (0, firebase_1.sendPushNotificationFirebase)({ title, body, token });
        if (result.success) {
            res.json({
                message: "Notification sent successfully",
                messageId: result.messageId,
            });
        }
        else {
            res.status(500).json({
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ============ Notification Logs (Local DB) ============
// Get notification logs
router.get("/notifications/logs", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const [logs] = await db_1.db.query(`SELECT * FROM notifications_log ORDER BY created_at DESC LIMIT ?`, [limit]);
        res.json({
            total: logs.length,
            data: logs,
        });
    }
    catch (error) {
        console.error("Error fetching notification logs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get notification logs for user
router.get("/notifications/logs/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const [logs] = await db_1.db.query(`SELECT nl.* FROM notifications_log nl
       JOIN device_tokens dt ON nl.device_token_id = dt.id
       WHERE dt.user_id = ?
       ORDER BY nl.created_at DESC LIMIT ?`, [userId, limit]);
        res.json({
            userId,
            total: logs.length,
            data: logs,
        });
    }
    catch (error) {
        console.error("Error fetching notification logs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ============ Transaction Events (Local DB) ============
// Get transaction events
router.get("/events/transactions", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const [events] = await db_1.db.query(`SELECT * FROM transaction_events ORDER BY created_at DESC LIMIT ?`, [limit]);
        res.json({
            total: events.length,
            data: events,
        });
    }
    catch (error) {
        console.error("Error fetching transaction events:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
