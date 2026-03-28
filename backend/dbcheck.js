const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  let log = 'Start\n';
  try {
    const c = await mysql.createConnection({host:'127.0.0.1', user:'root', password:'', database:'trello_clone'});
    const [boards] = await c.query('SELECT * FROM boards');
    log += `Boards: ${boards.length}\n`;
    await c.end();
  } catch (e) {
    log += `Error: ${e.message}\n`;
  }
  fs.writeFileSync('dbcheck.txt', log);
})();
