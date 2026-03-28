const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/cards/:cardId/comments - Get comments for a card
router.get('/cards/:cardId/comments', async (req, res, next) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*, m.name as member_name, m.avatar_color as member_avatar_color
       FROM comments c
       JOIN members m ON c.member_id = m.id
       WHERE c.card_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.cardId]
    );
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/cards/:cardId/comments - Add a comment
router.post('/cards/:cardId/comments', async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { content, member_id } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Default to member 1 (Alex) if no member specified
    const memberId = member_id || 1;
    
    const [result] = await pool.query(
      'INSERT INTO comments (card_id, member_id, content) VALUES (?, ?, ?)',
      [cardId, memberId, content.trim()]
    );
    
    const [comment] = await pool.query(
      `SELECT c.*, m.name as member_name, m.avatar_color as member_avatar_color
       FROM comments c
       JOIN members m ON c.member_id = m.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(comment[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/comments/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/cards/:cardId/activity - Get activity log
router.get('/cards/:cardId/activity', async (req, res, next) => {
  try {
    const [activity] = await pool.query(
      `SELECT a.*, m.name as member_name, m.avatar_color as member_avatar_color
       FROM activity_log a
       JOIN members m ON a.member_id = m.id
       WHERE a.card_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.cardId]
    );
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
