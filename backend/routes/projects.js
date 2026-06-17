const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const [projects] = await db.query('SELECT * FROM projects');
            return res.json(projects);
        } else {
            const [projects] = await db.query('SELECT * FROM projects WHERE client_id = ?', [req.user.id]);
            return res.json(projects);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// PUT /api/projects/:id/notes
router.put('/:id/notes', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { notes } = req.body;
    try {
        await db.query('UPDATE projects SET notes = ? WHERE id = ?', [notes, req.params.id]);
        res.json({ message: 'Notas actualizadas' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating notes' });
    }
});

module.exports = router;
