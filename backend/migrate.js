const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'rocketdesigners',
            password: process.env.DB_PASSWORD || 'FnG7bC44FDAt',
            database: process.env.DB_NAME || 'rocketdesigners_rocket'
        });

        await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL;');
        console.log('Added email column to users table.');
        await connection.end();
    } catch(err) {
        if(err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column email already exists.');
        } else {
            console.error(err);
        }
    }
}
migrate();
