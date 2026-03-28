const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/boards - List all boards
router.get('/', async (req, res, next) => {
  try {
    const [boards] = await pool.query(
      'SELECT * FROM boards ORDER BY created_at DESC'
    );
    
    // Get list and card counts for each board
    for (const board of boards) {
      const [listCount] = await pool.query(
        'SELECT COUNT(*) as count FROM lists WHERE board_id = ? AND archived = FALSE',
        [board.id]
      );
      const [cardCount] = await pool.query(
        `SELECT COUNT(*) as count FROM cards c 
         JOIN lists l ON c.list_id = l.id 
         WHERE l.board_id = ? AND c.archived = FALSE AND l.archived = FALSE`,
        [board.id]
      );
      board.listCount = listCount[0].count;
      board.cardCount = cardCount[0].count;
    }
    
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

// POST /api/boards - Create a board
router.post('/', async (req, res, next) => {
  try {
    const { title, background } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Board title is required' });
    }
    
    const bg = background || 'linear-gradient(135deg, #0079BF 0%, #5067C5 100%)';
    const [result] = await pool.query(
      'INSERT INTO boards (title, background) VALUES (?, ?)',
      [title.trim(), bg]
    );
    
    // Create default labels
    await pool.query(
      `INSERT INTO labels (board_id, name, color) VALUES 
        (?, '', '#61BD4F'), (?, '', '#F2D600'), (?, '', '#FF9F1A'),
        (?, '', '#EB5A46'), (?, '', '#C377E0'), (?, '', '#0079BF')`,
      [result.insertId, result.insertId, result.insertId, result.insertId, result.insertId, result.insertId]
    );
    
    const [board] = await pool.query('SELECT * FROM boards WHERE id = ?', [result.insertId]);
    res.status(201).json(board[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/boards/:id - Get board with all its lists, cards, labels
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [boards] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    const board = boards[0];
    
    // Get lists
    const [lists] = await pool.query(
      'SELECT * FROM lists WHERE board_id = ? AND archived = FALSE ORDER BY position',
      [id]
    );
    
    // Get all cards for this board's lists
    for (const list of lists) {
      const [cards] = await pool.query(
        `SELECT c.*, 
          GROUP_CONCAT(DISTINCT cl.label_id) as label_ids,
          GROUP_CONCAT(DISTINCT cm.member_id) as member_ids
         FROM cards c
         LEFT JOIN card_labels cl ON c.id = cl.card_id
         LEFT JOIN card_members cm ON c.id = cm.card_id
         WHERE c.list_id = ? AND c.archived = FALSE
         GROUP BY c.id
         ORDER BY c.position`,
        [list.id]
      );
      
      // Process cards: get labels and members as arrays
      for (const card of cards) {
        card.labelIds = card.label_ids ? card.label_ids.split(',').map(Number) : [];
        card.memberIds = card.member_ids ? card.member_ids.split(',').map(Number) : [];
        delete card.label_ids;
        delete card.member_ids;
        
        // Get checklist progress
        const [checklists] = await pool.query(
          'SELECT id FROM checklists WHERE card_id = ?',
          [card.id]
        );
        if (checklists.length > 0) {
          const checklistIds = checklists.map(c => c.id);
          const [items] = await pool.query(
            `SELECT COUNT(*) as total, SUM(completed) as completed 
             FROM checklist_items WHERE checklist_id IN (?)`,
            [checklistIds]
          );
          card.checklistTotal = items[0].total || 0;
          card.checklistCompleted = parseInt(items[0].completed) || 0;
        } else {
          card.checklistTotal = 0;
          card.checklistCompleted = 0;
        }
        
        // Get comment count
        const [commentCount] = await pool.query(
          'SELECT COUNT(*) as count FROM comments WHERE card_id = ?',
          [card.id]
        );
        card.commentCount = commentCount[0].count;
      }
      
      list.cards = cards;
    }
    
    // Get labels for the board
    const [labels] = await pool.query(
      'SELECT * FROM labels WHERE board_id = ?',
      [id]
    );
    
    // Get all members
    const [members] = await pool.query('SELECT * FROM members');
    
    board.lists = lists;
    board.labels = labels;
    board.members = members;
    
    res.json(board);
  } catch (err) {
    next(err);
  }
});

// GET /api/boards/:id/archived-cards - Get all archived cards for a board
router.get('/:id/archived-cards', async (req, res, next) => {
  try {
    const [cards] = await pool.query(
      `SELECT c.*, l.title as list_title FROM cards c 
       JOIN lists l ON c.list_id = l.id 
       WHERE l.board_id = ? AND c.archived = TRUE
       ORDER BY c.updated_at DESC`,
      [req.params.id]
    );
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

// PUT /api/boards/:id - Update a board
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, background } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title.trim());
    }
    if (background !== undefined) {
      updates.push('background = ?');
      values.push(background);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    await pool.query(`UPDATE boards SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [board] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    res.json(board[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/boards/:id - Delete a board
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM boards WHERE id = ?', [req.params.id]);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
