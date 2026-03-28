const mysql = require('mysql2/promise');

async function debug() {
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    user: '41McWwK71rqkqsA.root',
    password: '3A3PXcIbJTRaQ9St',
    database: 'test',
    port: 4000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [attachments] = await connection.query('SELECT * FROM attachments');
    console.log('--- ATTACHMENTS ---');
    console.log(JSON.stringify(attachments, null, 2));

    const [activity] = await connection.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 5');
    console.log('--- LATEST ACTIVITY ---');
    console.log(JSON.stringify(activity, null, 2));

    const [cards] = await connection.query('SELECT id, title FROM cards');
    console.log('--- CARDS ---');
    console.log(JSON.stringify(cards, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
