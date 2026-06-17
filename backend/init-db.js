const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Connect without a specific database to ensure we can create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'rocketdesigners',
            password: process.env.DB_PASSWORD || 'FnG7bC44FDAt',
        });

        const dbName = process.env.DB_NAME || 'rocketdesigners_rocket';

        // await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Using Database '${dbName}'.`);

        await connection.query(`USE \`${dbName}\`;`);

        // Create Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table 'users' verified/created.");

        // Create Projects table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                client_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'projects' verified/created.");

        // Create Tickets table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                client_id INT NOT NULL,
                type ENUM('Solicitud de cambio', 'Mejora', 'Reporte de Bug', 'Duda general') NOT NULL,
                priority ENUM('Baja', 'Media', 'Alta', 'Urgente') NOT NULL,
                status ENUM('Nuevo', 'En Revisión', 'En Desarrollo', 'Esperando al Cliente', 'Completado') NOT NULL DEFAULT 'Nuevo',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                attachment_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'tickets' verified/created.");

        // Create Messages (Logs) table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                sender_id INT,
                content TEXT NOT NULL,
                type ENUM('user_message', 'system_log') NOT NULL DEFAULT 'user_message',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);
        console.log("Table 'messages' verified/created.");

        // Create an initial admin if not exists
        const [rows] = await connection.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1;`);
        if (rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash('admin123', 10);
            await connection.query(`
                INSERT INTO users (username, password_hash, role, name) 
                VALUES ('admin', ?, 'admin', 'Administrador Principal');
            `, [hashed]);
            console.log("Initial admin created (username: admin, password: admin123)");
        }

        await connection.end();
        console.log("Database initialization complete.");

    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

initializeDatabase();
