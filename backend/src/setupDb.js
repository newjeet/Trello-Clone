const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // Connect without specifying a database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trello_clone',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
  });

  console.log('Connected to MySQL server.');

  // Read and execute the schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await connection.query(schema);
    console.log('Database schema created successfully!');
  } catch (err) {
    console.error('Error creating schema:', err.message);
    throw err;
  }

  await connection.end();
  console.log('Setup complete.');
}

setupDatabase().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
