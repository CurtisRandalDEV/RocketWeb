const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const ticketsRoutes = require('./routes/tickets');
const projectsRoutes = require('./routes/projects');
const { authMiddleware, staffMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware, staffMiddleware, adminRoutes);
app.use('/api/tickets', authMiddleware, ticketsRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);

app.get('/', (req, res) => {
    res.send('Rocket Designers HelpDesk API');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
