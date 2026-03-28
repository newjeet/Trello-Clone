const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trello_clone',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true
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
        ('Arjun Reddy', 'arjun@example.com', '#C377E0')
    `);

    // --- Boards ---
    await connection.query(`
      INSERT INTO boards (title, background) VALUES
        ('Product Launch Q2', 'linear-gradient(135deg, #0079BF 0%, #5067C5 100%)'),
        ('Website Redesign', 'linear-gradient(135deg, #00C2E0 0%, #0079BF 100%)'),
        ('Mobile App Development', 'linear-gradient(135deg, #61BD4F 0%, #0079BF 100%)')
    `);

    // --- Labels for Board 1 ---
    await connection.query(`
      INSERT INTO labels (board_id, name, color) VALUES
        (1, 'Bug', '#EB5A46'),
        (1, 'Feature', '#61BD4F'),
        (1, 'Urgent', '#F2D600'),
        (1, 'Design', '#C377E0'),
        (1, 'Backend', '#0079BF'),
        (1, 'Frontend', '#00C2E0')
    `);

    // Labels for Board 2
    await connection.query(`
      INSERT INTO labels (board_id, name, color) VALUES
        (2, 'UI', '#C377E0'),
        (2, 'UX', '#FF9F1A'),
        (2, 'Content', '#61BD4F'),
        (2, 'SEO', '#0079BF')
    `);

    // --- Lists for Board 1 ---
    await connection.query(`
      INSERT INTO lists (board_id, title, position) VALUES
        (1, 'Backlog', 1000),
        (1, 'To Do', 2000),
        (1, 'In Progress', 3000),
        (1, 'In Review', 4000),
        (1, 'Done', 5000)
    `);

    // Lists for Board 2
    await connection.query(`
      INSERT INTO lists (board_id, title, position) VALUES
        (2, 'Research', 1000),
        (2, 'Design', 2000),
        (2, 'Development', 3000),
        (2, 'Testing', 4000)
    `);

    // --- Cards for Board 1 ---
    // Backlog (list 1)
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, cover_color, due_date) VALUES
        (1, 'Research competitor pricing models', 'Analyze top 5 competitors and their pricing tiers. Document findings in a spreadsheet.', 1000, NULL, NULL),
        (1, 'Draft Q2 marketing strategy', 'Create a comprehensive marketing plan including social media, email campaigns, and paid ads.', 2000, NULL, '2026-04-15 00:00:00'),
        (1, 'User feedback survey analysis', 'Review and categorize the 200+ responses from our latest user survey.', 3000, '#F2D600', NULL)
    `);

    // To Do (list 2)
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, due_date) VALUES
        (2, 'Design new landing page', 'Create a modern, conversion-optimized landing page for the product launch.', 1000, '2026-04-01 00:00:00'),
        (2, 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment.', 2000, '2026-04-05 00:00:00'),
        (2, 'Write API documentation', 'Document all REST endpoints using OpenAPI/Swagger specification.', 3000, NULL)
    `);

    // In Progress (list 3)
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, cover_color, due_date) VALUES
        (3, 'Implement user authentication', 'Add JWT-based auth with login, register, and password reset flows.', 1000, '#61BD4F', '2026-03-30 00:00:00'),
        (3, 'Database schema optimization', 'Review and optimize slow queries. Add missing indexes.', 2000, NULL, '2026-03-29 00:00:00'),
        (3, 'Build notification system', 'Real-time notifications using WebSockets for card updates and mentions.', 3000, NULL, '2026-04-02 00:00:00')
    `);

    // In Review (list 4)
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position, due_date) VALUES
        (4, 'Payment integration', 'Stripe integration for subscription billing. Includes webhook handling.', 1000, '2026-03-28 00:00:00'),
        (4, 'Mobile responsive layouts', 'Ensure all pages work on mobile, tablet, and desktop viewports.', 2000, NULL)
    `);

    // Done (list 5)
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position) VALUES
        (5, 'Project setup and scaffolding', 'Initialize React frontend and Express backend with proper project structure.', 1000),
        (5, 'Design system implementation', 'Create reusable component library with consistent styling.', 2000)
    `);

    // --- Card Labels ---
    await connection.query(`
      INSERT INTO card_labels (card_id, label_id) VALUES
        (1, 2), (1, 5),
        (2, 3),
        (3, 2),
        (4, 4), (4, 6),
        (5, 5),
        (6, 5), (6, 2),
        (7, 5), (7, 2),
        (8, 5), (8, 1),
        (9, 2), (9, 6),
        (10, 5), (10, 2),
        (11, 6), (11, 4),
        (12, 5),
        (13, 4), (13, 6)
    `);

    // --- Card Members ---
    await connection.query(`
      INSERT INTO card_members (card_id, member_id) VALUES
        (1, 1), (1, 3),
        (2, 2),
        (3, 4),
        (4, 2), (4, 5),
        (5, 3),
        (6, 1),
        (7, 3), (7, 1),
        (8, 3),
        (9, 5), (9, 2),
        (10, 1), (10, 3),
        (11, 2), (11, 4),
        (12, 1),
        (13, 2)
    `);

    // --- Checklists ---
    await connection.query(`
      INSERT INTO checklists (card_id, title, position) VALUES
        (4, 'Design Tasks', 1000),
        (5, 'Pipeline Steps', 1000),
        (7, 'Auth Implementation', 1000),
        (10, 'Payment Checklist', 1000)
    `);

    // --- Checklist Items ---
    await connection.query(`
      INSERT INTO checklist_items (checklist_id, title, completed, position) VALUES
        (1, 'Create wireframes', TRUE, 1000),
        (1, 'Design hero section', TRUE, 2000),
        (1, 'Design features section', FALSE, 3000),
        (1, 'Design pricing section', FALSE, 4000),
        (1, 'Mobile responsive mockups', FALSE, 5000),
        (2, 'Set up GitHub Actions workflow', TRUE, 1000),
        (2, 'Configure test runner', TRUE, 2000),
        (2, 'Add deployment step', FALSE, 3000),
        (2, 'Set up staging environment', FALSE, 4000),
        (3, 'JWT token generation', TRUE, 1000),
        (3, 'Login endpoint', TRUE, 2000),
        (3, 'Register endpoint', TRUE, 3000),
        (3, 'Password reset flow', FALSE, 4000),
        (3, 'Email verification', FALSE, 5000),
        (4, 'Stripe account setup', TRUE, 1000),
        (4, 'Payment intent API', TRUE, 2000),
        (4, 'Webhook handling', TRUE, 3000),
        (4, 'Subscription management', FALSE, 4000),
        (4, 'Invoice generation', FALSE, 5000)
    `);

    // --- Comments ---
    await connection.query(`
      INSERT INTO comments (card_id, member_id, content, created_at) VALUES
        (7, 1, 'JWT implementation is looking good. Let me review the refresh token logic.', '2026-03-25 10:30:00'),
        (7, 3, 'Added the refresh token rotation. Ready for review.', '2026-03-25 14:15:00'),
        (10, 1, 'Stripe test mode is working. Need to verify webhook signatures in production.', '2026-03-26 09:00:00'),
        (10, 3, 'Webhook signature verification added. All tests passing.', '2026-03-26 16:45:00'),
        (4, 2, 'The wireframes look great! Moving to the design phase now.', '2026-03-24 11:00:00'),
        (8, 3, 'Found a slow query on the cards table. Adding a composite index should fix it.', '2026-03-27 08:30:00')
    `);

    // --- Activity Log ---
    await connection.query(`
      INSERT INTO activity_log (card_id, board_id, member_id, action, details, created_at) VALUES
        (7, 1, 3, 'moved', 'Moved from "To Do" to "In Progress"', '2026-03-24 09:00:00'),
        (10, 1, 1, 'moved', 'Moved from "In Progress" to "In Review"', '2026-03-26 17:00:00'),
        (12, 1, 1, 'moved', 'Moved from "In Review" to "Done"', '2026-03-23 15:00:00'),
        (4, 1, 2, 'comment', 'Added a comment', '2026-03-24 11:00:00'),
        (7, 1, 1, 'comment', 'Added a comment', '2026-03-25 10:30:00'),
        (10, 1, 3, 'checklist', 'Completed "Webhook handling" in "Payment Checklist"', '2026-03-26 14:00:00')
    `);

    // --- Cards for Board 2 ---
    await connection.query(`
      INSERT INTO cards (list_id, title, description, position) VALUES
        (6, 'Analyze current site performance', 'Run Lighthouse audit and document improvement areas.', 1000),
        (6, 'Competitor website analysis', 'Study 5 competitor websites for design inspiration.', 2000),
        (7, 'Homepage redesign mockup', 'Create Figma mockup for the new homepage layout.', 1000),
        (7, 'Navigation restructure', 'Simplify the main navigation to improve UX.', 2000),
        (8, 'Implement new header component', 'Build the responsive header with mega-menu.', 1000),
        (9, 'Cross-browser testing', 'Test on Chrome, Firefox, Safari, and Edge.', 1000)
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
