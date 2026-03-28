const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trello_clone',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
  });

  console.log('Connected to database. Seeding data...');

  try {
    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['activity_log','comments','checklist_items','checklists','card_members','card_labels','cards','labels','lists','boards','members'];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // --- Members ---
    await connection.query(`
      INSERT INTO members (name, email, avatar_color) VALUES
        ('Aarav Patel', 'aarav@example.com', '#0079BF'),
        ('Diya Sharma', 'diya@example.com', '#EB5A46'),
        ('Rohan Gupta', 'rohan@example.com', '#61BD4F'),
        ('Neha Desai', 'neha@example.com', '#F2D600'),
        ('Arjun Reddy', 'arjun@example.com', '#C377E0'),
        ('Sana Khan', 'sana@example.com', '#FF9F1A'),
        ('Vikram Singh', 'vikram@example.com', '#89609E')
    `);

    // --- Boards ---
    await connection.query(`
      INSERT INTO boards (title, background) VALUES
        ('Product Launch Q2', 'linear-gradient(135deg, #0079BF 0%, #5067C5 100%)'),
        ('Website Redesign', 'linear-gradient(135deg, #00C2E0 0%, #0079BF 100%)'),
        ('Mobile App Development', 'linear-gradient(135deg, #61BD4F 0%, #0079BF 100%)'),
        ('Daily Operations', 'linear-gradient(135deg, #A8C6FA 0%, #0C2D48 100%)')
    `);

    // --- Labels for all boards ---
    // Board 1
    await connection.query(`
      INSERT INTO labels (board_id, name, color) VALUES
        (1, 'High Priority', '#EB5A46'), (1, 'Feature', '#61BD4F'), (1, 'In Progress', '#F2D600'),
        (1, 'Design', '#C377E0'), (1, 'API', '#0079BF'), (1, 'Review', '#FF9F1A')
    `);
    // Board 2
    await connection.query(`
      INSERT INTO labels (board_id, name, color) VALUES
        (2, 'UI', '#C377E0'), (2, 'UX', '#FF9F1A'), (2, 'Content', '#61BD4F'), (2, 'Technical', '#0079BF')
    `);
    // Board 3
    await connection.query(`
      INSERT INTO labels (board_id, name, color) VALUES
        (3, 'iOS', '#C377E0'), (3, 'Android', '#61BD4F'), (3, 'React Native', '#00C2E0'), (3, 'Core', '#0079BF')
    `);

    // --- Lists ---
    // Board 1
    await connection.query(`
      INSERT INTO lists (board_id, title, position) VALUES
        (1, 'Backlog', 1000), (1, 'To Do', 2000), (1, 'In Progress', 3000), (1, 'In Review', 4000), (1, 'Done', 5000)
    `);
    // Board 2
    await connection.query(`
      INSERT INTO lists (board_id, title, position) VALUES
        (2, 'Research', 1000), (2, 'Wireframes', 2000), (2, 'Production', 3000), (2, 'Live', 4000)
    `);
    // Board 3
    await connection.query(`
      INSERT INTO lists (board_id, title, position) VALUES
        (3, 'Roadmap', 1000), (3, 'Design Prototype', 2000), (3, 'Dev Alpha', 3000), (3, 'Testing', 4000)
    `);

    // --- Cards ---
    // Board 1 - Backlog
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, due_date) VALUES
        (1, 'Analyze competitor Q1 gains', 'Comprehensive study of top 5 competitors.', 1000, '2026-04-10 10:00:00'),
        (1, 'Draft PR statement for June', 'Official press release for the new feature.', 2000, NULL),
        (1, 'User persona workshop', 'Re-aligning user personas for Q2 targets.', 3000, '2026-04-15 14:00:00')
    `);
    // Board 1 - To Do
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, cover_color, due_date) VALUES
        (2, 'Finalize pricing tiers', 'Tiered pricing logic for enterprise accounts.', 1000, '#EB5A46', '2026-04-01 09:00:00'),
        (2, 'Security audit (Phase 1)', 'Initial scan of the authentication layer.', 2000, '#61BD4F', NULL)
    `);
    // Board 1 - In Progress
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, due_date) VALUES
        (3, 'API Documentation update', 'Documenting new v2 endpoints.', 1000, '2026-03-30 18:00:00'),
        (3, 'Dark Mode support', 'Implementing CSS variables for theme switching.', 2000, NULL)
    `);

    // Board 3 - Roadmap
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, cover_color) VALUES
        (10, 'Push Notifications Service', 'Integrate Firebase for push alerts.', 1000, '#0079BF'),
        (10, 'Universal Search Bar', 'Global search across all boards.', 2000, '#FF9F1A')
    `);
    // Board 3 - Design Prototype
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, due_date) VALUES
        (11, 'Hi-Fi Prototyping (Figma)', 'Final mockups for the dashboard.', 1000, '2026-03-29 12:00:00'),
        (11, 'Design System Refresh', 'Consistency across all mobile icons.', 2000, NULL)
    `);

    // --- Card Junctions (Labels) ---
    await connection.query(`
      INSERT INTO card_labels (card_id, label_id) VALUES
        (1, 1), (1, 5),
        (4, 1), (4, 3),
        (5, 1),
        (6, 5), (6, 3),
        (7, 4),
        (8, 11), (8, 13)
    `);

    // --- Card Junctions (Members) ---
    await connection.query(`
      INSERT INTO card_members (card_id, member_id) VALUES
        (1, 1), (1, 2),
        (4, 3), (4, 4),
        (6, 5), (6, 1),
        (8, 2), (8, 6),
        (10, 7)
    `);

    // --- Checklists ---
    await connection.query(`
      INSERT INTO checklists (card_id, title, position) VALUES
        (1, 'Competitors to analyze', 1000),
        (4, 'Pricing Milestones', 1000),
        (8, 'Integration Steps', 1000)
    `);

    // --- Checklist Items ---
    await connection.query(`
      INSERT INTO checklist_items (checklist_id, title, completed, position) VALUES
        (1, 'Asana', TRUE, 1000), (1, 'Monday.com', TRUE, 2000), (1, 'ClickUp', FALSE, 3000),
        (2, 'Basic Tier', TRUE, 1000), (2, 'Pro Tier', TRUE, 2000), (2, 'Enterprise Tier', FALSE, 3000),
        (3, 'Firebase setup', TRUE, 1000), (3, 'Token exchange', FALSE, 2000)
    `);

    // --- Comments ---
    await connection.query(`
      INSERT INTO comments (card_id, member_id, content) VALUES
        (1, 1, 'Starting the competitor analysis today. Will focus on SaaS pricing models.'),
        (1, 3, 'Make sure to check out the new Notion pricing update as well!'),
        (4, 2, 'I think the Enterprise tier should include 24/7 support.'),
        (6, 5, 'V2 documentation is 80% complete. Just need to finish the Webhooks section.'),
        (8, 7, 'Firebase integration is straightforward. I will start the token exchange logic tomorrow.')
    `);

    // --- Attachments (Mock data) ---
    await connection.query(`
      INSERT INTO attachments (card_id, file_name, original_name, mime_type, size) VALUES
        (1, 'competitor_matrix_2026.pdf', 'competitor_matrix_2026.pdf', 'application/pdf', 1240000),
        (4, 'pricing_proposal_v1.docx', 'Pricing Proposal V1.docx', 'application/msword', 450000),
        (10, 'app_icon_final.png', 'App Icon Final.png', 'image/png', 850000)
    `);

    console.log('Seed data inserted successfully!');
  } catch (err) {
    console.error('Error seeding data:', err.message);
    throw err;
  }

  await connection.end();
  console.log('Seeding complete.');
}

seedDatabase().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
