const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/cards/:cardId/members/:memberId - Assign member to card
router.post('/cards/:cardId/members/:memberId', async (req, res, next) => {
  try {
    const { cardId, memberId } = req.params;
    await pool.query(
      'INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)',
      [cardId, memberId]
    );
    
    const [member] = await pool.query('SELECT * FROM members WHERE id = ?', [memberId]);
    res.json(member[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cards/:cardId/members/:memberId - Remove member from card
router.delete('/cards/:cardId/members/:memberId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM card_members WHERE card_id = ? AND member_id = ?',
      [req.params.cardId, req.params.memberId]
    );
    res.json({ message: 'Member removed from card' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
