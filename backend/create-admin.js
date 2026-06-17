const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'rocketdesigners',
            password: process.env.DB_PASSWORD || 'FnG7bC44FDAt',
            database: process.env.DB_NAME || 'rocketdesigners_helpdesk',
        });

        const hashed = await bcrypt.hash('Hola1243', 10);
        
        await connection.query(`
            INSERT INTO users (username, password_hash, role, name, company, phone) 
            VALUES (?, ?, 'admin', ?, ?, ?)
        `, ['CurtisRandal', hashed, 'Fernando Garcia CEO', 'Rocket Designers', '3112705049']);
        
        console.log("Admin user 'CurtisRandal' created successfully.");
        await connection.end();
    } catch (error) {
        console.error("Error creating admin:", error);
    }
}

createAdmin();
