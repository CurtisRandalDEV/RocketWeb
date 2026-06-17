const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'rocketdesigners',
    password: process.env.DB_PASSWORD || 'FnG7bC44FDAt',
    database: process.env.DB_NAME || 'rocketdesigners_helpdesk',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
