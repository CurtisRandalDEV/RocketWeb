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

        console.log('Running migration...');
        
        try {
            await connection.query('ALTER TABLE messages ADD COLUMN is_internal BOOLEAN DEFAULT FALSE;');
            console.log('Added is_internal column to messages table.');
        } catch(err) {
            if(err.code === 'ER_DUP_FIELDNAME') console.log('Column is_internal already exists.');
            else throw err;
        }

        try {
            await connection.query('ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL;');
            console.log('Added attachment_url column to messages table.');
        } catch(err) {
            if(err.code === 'ER_DUP_FIELDNAME') console.log('Column attachment_url already exists.');
            else throw err;
        }

        await connection.end();
        console.log('Migration complete.');
    } catch(err) {
        console.error('Migration failed:', err);
    }
}
migrate();
