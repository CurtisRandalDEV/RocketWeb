const express = require('express');
const router = express.Router();
const db = require('../db');
const whatsappService = require('../services/whatsappService');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rocketdesigners',
    allowed_formats: ['jpg', 'png', 'pdf', 'jpeg', 'gif', 'webp']
  },
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB
});

// 1. GET /api/tickets (Admin sees all, Client sees theirs)
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT t.*, p.name as project_name, u.name as client_name, DATEDIFF(NOW(), t.created_at) as days_open
            FROM tickets t
            JOIN projects p ON t.project_id = p.id
            JOIN users u ON t.client_id = u.id
        `;
        const params = [];

        if (req.user.role === 'client') {
            query += ' WHERE t.client_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY t.created_at DESC';

        const [tickets] = await db.query(query, params);

        // Calculate SLA color
        const processedTickets = tickets.map(t => {
            let slaColor = 'green';
            if (t.status !== 'Completado') {
                if (t.days_open >= 7) slaColor = 'red';
                else if (t.days_open >= 3) slaColor = 'yellow';
            } else {
                slaColor = 'gray'; // Resolved
            }
            return { ...t, slaColor };
        });

        res.json(processedTickets);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// POST /api/tickets/upload
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = req.file.path;
    res.json({ url });
});

// 2. POST /api/tickets (Client creates ticket)
router.post('/', async (req, res) => {
    const { project_id, type, priority, title, description, attachment_url } = req.body;
    const client_id = req.user.id;

    try {
        const [result] = await db.query(`
            INSERT INTO tickets (project_id, client_id, type, priority, title, description, attachment_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [project_id, client_id, type, priority, title, description, attachment_url]);

        const ticketId = result.insertId;

        // Log initial creation
        await db.query(`
            INSERT INTO messages (ticket_id, content, type)
            VALUES (?, 'El ticket ha sido creado y está Nuevo.', 'system_log')
        `, [ticketId]);

        // WhatsApp Notification (Mock)
        const [[client]] = await db.query('SELECT phone, name FROM users WHERE id = ?', [client_id]);
        await whatsappService.notifyTicketCreated(client.phone, ticketId, project_id);

        res.json({ message: 'Ticket creado', ticketId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando ticket' });
    }
});

// 3. GET /api/tickets/:id
router.get('/:id', async (req, res) => {
    try {
        const [[ticket]] = await db.query(`
            SELECT t.*, p.name as project_name, u.name as client_name 
            FROM tickets t
            JOIN projects p ON t.project_id = p.id
            JOIN users u ON t.client_id = u.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (!ticket) return res.status(404).json({ message: 'Not found' });

        // Security check
        if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// 4. PATCH /api/tickets/:id/status (Admin/Staff changes status)
router.patch('/:id/status', async (req, res) => {
    if (req.user.role !== 'ceo' && req.user.role !== 'developer') return res.status(403).json({ message: 'Forbidden' });
    
    const { status } = req.body;
    const ticketId = req.params.id;

    try {
        const [[ticket]] = await db.query('SELECT client_id FROM tickets WHERE id = ?', [ticketId]);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        await db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, ticketId]);

        // Log the change
        await db.query(`
            INSERT INTO messages (ticket_id, sender_id, content, type)
            VALUES (?, ?, ?, 'system_log')
        `, [ticketId, req.user.id, `El ticket pasó a ${status}`]);

        if (req.user.role === 'developer' || req.user.role === 'ceo') {
            await db.query(`
                INSERT INTO activity_logs (user_id, action, details)
                VALUES (?, 'ticket_update', ?)
            `, [req.user.id, `Actualizó estado del ticket #${ticketId} a ${status}`]);
        }

        // WhatsApp Notification
        const [[client]] = await db.query('SELECT phone FROM users WHERE id = ?', [ticket.client_id]);
        
        if (status === 'Completado') {
            await whatsappService.notifyTicketCompleted(client.phone, ticketId);
        } else {
            await whatsappService.notifyTicketStatusChanged(client.phone, ticketId, status);
        }

        res.json({ message: 'Estado actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// 5. GET /api/tickets/:id/messages
router.get('/:id/messages', async (req, res) => {
    try {
        let query = `
            SELECT m.*, u.name as sender_name, u.role as sender_role
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.ticket_id = ?
        `;
        const params = [req.params.id];

        if (req.user.role === 'client') {
            query += ' AND m.is_internal = FALSE';
        }

        query += ' ORDER BY m.created_at ASC';

        const [messages] = await db.query(query, params);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// 6. POST /api/tickets/:id/messages
router.post('/:id/messages', async (req, res) => {
    const { content, is_internal, attachment_url } = req.body;
    const ticketId = req.params.id;
    const senderId = req.user.id;
    
    const isInternalFinal = (req.user.role !== 'client' && is_internal) ? true : false;

    try {
        await db.query(`
            INSERT INTO messages (ticket_id, sender_id, content, type, is_internal, attachment_url)
            VALUES (?, ?, ?, 'user_message', ?, ?)
        `, [ticketId, senderId, content, isInternalFinal, attachment_url || null]);

        res.json({ message: 'Mensaje enviado' });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

module.exports = router;
