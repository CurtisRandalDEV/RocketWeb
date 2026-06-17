const db = require('./db');

async function migrateRoles() {
    try {
        console.log('Starting migration...');

        // 1. Temporarily add 'ceo' and 'developer' to the ENUM
        console.log('Altering users table role column (step 1)...');
        await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'ceo', 'developer', 'client') NOT NULL DEFAULT 'client'");

        // 2. Update existing admins to ceo
        console.log('Updating existing admin users to ceo...');
        await db.query("UPDATE users SET role = 'ceo' WHERE role = 'admin'");

        // 3. Remove 'admin' from ENUM
        console.log('Altering users table role column (step 2 - removing admin)...');
        await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('ceo', 'developer', 'client') NOT NULL DEFAULT 'client'");

        // 4. Create activity_logs table
        console.log('Creating activity_logs table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateRoles();
