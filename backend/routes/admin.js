const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { ceoMiddleware } = require('../middleware/auth');

// 1. GET /api/admin/metrics
router.get('/metrics', async (req, res) => {
    try {
        // Tickets resolved per month (simplified, assuming current year)
        const [resolvedByMonth] = await db.query(`
            SELECT MONTH(updated_at) as month, COUNT(*) as count 
            FROM tickets 
            WHERE status = 'Completado' 
            GROUP BY MONTH(updated_at)
        `);

        // Client with most requests
        const [topClients] = await db.query(`
            SELECT users.name, users.company, COUNT(tickets.id) as ticket_count 
            FROM tickets 
            JOIN users ON tickets.client_id = users.id 
            GROUP BY users.id 
            ORDER BY ticket_count DESC 
            LIMIT 5
        `);

        // General stats
        const [[{ total_clients }]] = await db.query("SELECT COUNT(*) as total_clients FROM users WHERE role = 'client'");
        const [[{ total_tickets }]] = await db.query("SELECT COUNT(*) as total_tickets FROM tickets");

        res.json({
            resolvedByMonth,
            topClients,
            general: { total_clients, total_tickets }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo métricas' });
    }
});

// 2. GET /api/admin/clients (List clients)
router.get('/clients', async (req, res) => {
    try {
        const [clients] = await db.query(`SELECT id, username, name, email, company, phone, created_at FROM users WHERE role = 'client'`);
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// 3. POST /api/admin/clients (Create client & generate key)
router.post('/clients', ceoMiddleware, async (req, res) => {
    const { name, email, company, phone } = req.body;
    
    // Generate simple username and key
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
    const plainKey = Math.random().toString(36).slice(-8); // Random 8 char password
    const hashedKey = await bcrypt.hash(plainKey, 10);

    try {
        await db.query(`
            INSERT INTO users (username, password_hash, role, name, email, company, phone)
            VALUES (?, ?, 'client', ?, ?, ?, ?)
        `, [username, hashedKey, name, email, company, phone]);

        res.json({ message: 'Cliente creado', credentials: { username, key: plainKey } });
    } catch (error) {
        res.status(500).json({ message: 'Error creando cliente' });
    }
});

// 4. POST /api/admin/clients/:id/regenerate-key
router.post('/clients/:id/regenerate-key', ceoMiddleware, async (req, res) => {
    const clientId = req.params.id;
    const plainKey = Math.random().toString(36).slice(-8);
    const hashedKey = await bcrypt.hash(plainKey, 10);

    try {
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedKey, clientId]);
        res.json({ message: 'Key regenerada', newKey: plainKey });
    } catch (error) {
        res.status(500).json({ message: 'Error regenerando key' });
    }
});

// 5. GET /api/admin/projects
router.get('/projects', async (req, res) => {
    try {
        const [projects] = await db.query(`
            SELECT p.*, u.name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id
        `);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// 6. POST /api/admin/projects
router.post('/projects', ceoMiddleware, async (req, res) => {
    const { name, description, client_id } = req.body;
    try {
        await db.query('INSERT INTO projects (name, description, client_id) VALUES (?, ?, ?)', [name, description, client_id]);
        res.json({ message: 'Proyecto creado' });
    } catch (error) {
        res.status(500).json({ message: 'Error creando proyecto' });
    }
});

// 7. GET /api/admin/logs
router.get('/logs', ceoMiddleware, async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT al.*, u.name as user_name, u.role as user_role
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo logs' });
    }
});

module.exports = router;
