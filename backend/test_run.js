const fs = require('fs');
try {
  require('./src/index.js');
} catch (e) {
  fs.writeFileSync('crash.txt', e.stack, 'utf8');
}
process.on('uncaughtException', e => {
  fs.writeFileSync('crash2.txt', e.stack, 'utf8');
});
process.on('unhandledRejection', e => {
  fs.writeFileSync('crash3.txt', e.stack || e, 'utf8');
});
