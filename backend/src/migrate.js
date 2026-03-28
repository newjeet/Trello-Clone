const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trello_clone',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  console.log('Connected to MySQL server for migration.');

  try {
    await connection.query('ALTER TABLE cards ADD COLUMN cover_image VARCHAR(1000) DEFAULT NULL');
    console.log('Successfully added cover_image column to cards table.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('cover_image column already exists in cards table.');
    } else {
      console.error('Error adding cover_image:', err.message);
    }
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id INT NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) DEFAULT NULL,
        size INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        INDEX idx_attachments_card (card_id)
      )
    `);
    console.log('Successfully created attachments table.');
  } catch (err) {
    console.error('Error creating attachments table:', err.message);
  }

  await connection.end();
  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
