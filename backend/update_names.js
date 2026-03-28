const db = require('./src/db');

async function updateAllNames() {
  try {
    console.log('Updating all member names to Indian names (fixed schema)...');
    
    const [members] = await db.query('SELECT id FROM members ORDER BY id LIMIT 5');
    
    if (members.length === 0) {
      console.log('No members found!');
      process.exit(0);
    }

    const newNames = [
      'Aarav Patel',
      'Diya Sharma',
      'Rohan Gupta',
      'Neha Desai',
      'Arjun Reddy'
    ];
    
    for (let i = 0; i < members.length; i++) {
      const name = newNames[i % newNames.length];
      await db.query('UPDATE members SET name = ? WHERE id = ?', [name, members[i].id]);
      console.log(`Updated ID ${members[i].id} to ${name}`);
    }
    
    console.log('Update complete.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateAllNames();
