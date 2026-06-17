const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedDev() {
    try {
        const hashedKey = await bcrypt.hash('dev123', 10);
        await db.query(`
            INSERT INTO users (username, password_hash, role, name, email, company, phone)
            VALUES ('dev', ?, 'developer', 'Developer Test', 'dev@rocket.com', 'Rocket', '000')
        `, [hashedKey]);
        console.log('Developer user created (username: dev / password: dev123)');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seedDev();
