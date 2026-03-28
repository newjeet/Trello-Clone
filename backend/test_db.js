const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  let log = 'Starting\n';
  try {
    const c = await mysql.createConnection({host:'127.0.0.1', user:'root', password:''});
    log += 'Connected!\n';
    const [rows] = await c.query("SHOW DATABASES LIKE 'trello_clone'");
    log += 'DB count: ' + rows.length + '\n';
    await c.end();
  } catch (e) {
    log += 'Error: ' + e.message + '\n';
  }
  fs.writeFileSync('out.txt', log, 'utf8');
})();
