const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/boards/:boardId/search?q= - Search cards by title
router.get('/boards/:boardId/search', async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.json([]);
    }
    
    const [cards] = await pool.query(
      `SELECT c.*, l.title as list_title, l.id as list_id
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = ? AND c.archived = FALSE AND l.archived = FALSE
         AND (c.title LIKE ? OR c.description LIKE ?)
       ORDER BY c.title`,
      [boardId, `%${q}%`, `%${q}%`]
    );
    
    // Get labels and members for each card
    for (const card of cards) {
      const [labels] = await pool.query(
        `SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?`,
        [card.id]
      );
      card.labels = labels;
      card.labelIds = labels.map(l => l.id);
      
      const [members] = await pool.query(
        `SELECT m.* FROM members m JOIN card_members cm ON m.id = cm.member_id WHERE cm.card_id = ?`,
        [card.id]
      );
      card.members = members;
      card.memberIds = members.map(m => m.id);
    }
    
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

// GET /api/boards/:boardId/filter - Filter cards
router.get('/boards/:boardId/filter', async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { labels, members, due } = req.query;
    
    let query = `
      SELECT DISTINCT c.*, l.title as list_title
      FROM cards c
      JOIN lists l ON c.list_id = l.id
    `;
    
    const joins = [];
    const conditions = ['l.board_id = ?', 'c.archived = FALSE', 'l.archived = FALSE'];
    const values = [boardId];
    
    if (labels) {
      const labelIds = labels.split(',').map(Number);
      joins.push('JOIN card_labels cl ON c.id = cl.card_id');
      conditions.push(`cl.label_id IN (${labelIds.map(() => '?').join(',')})`);
      values.push(...labelIds);
    }
    
    if (members) {
      const memberIds = members.split(',').map(Number);
      joins.push('JOIN card_members cm ON c.id = cm.card_id');
      conditions.push(`cm.member_id IN (${memberIds.map(() => '?').join(',')})`);
      values.push(...memberIds);
    }
    
    if (due) {
      switch (due) {
        case 'overdue':
          conditions.push('c.due_date < NOW() AND c.due_complete = FALSE');
          break;
        case 'today':
          conditions.push('DATE(c.due_date) = CURDATE()');
          break;
        case 'week':
          conditions.push('c.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)');
          break;
        case 'none':
          conditions.push('c.due_date IS NULL');
          break;
        case 'complete':
          conditions.push('c.due_complete = TRUE');
          break;
      }
    }
    
    query = query + joins.join(' ') + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY c.position';
    
    const [cards] = await pool.query(query, values);
    
    // Get label and member IDs for each card
    for (const card of cards) {
      const [cardLabels] = await pool.query(
        'SELECT label_id FROM card_labels WHERE card_id = ?', [card.id]
      );
      card.labelIds = cardLabels.map(cl => cl.label_id);
      
      const [cardMembers] = await pool.query(
        'SELECT member_id FROM card_members WHERE card_id = ?', [card.id]
      );
      card.memberIds = cardMembers.map(cm => cm.member_id);
    }
    
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
