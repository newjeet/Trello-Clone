const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/boards/:boardId/labels - Get all labels for a board
router.get('/boards/:boardId/labels', async (req, res, next) => {
  try {
    const [labels] = await pool.query(
      'SELECT * FROM labels WHERE board_id = ?',
      [req.params.boardId]
    );
    res.json(labels);
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/labels - Create a label
router.post('/boards/:boardId/labels', async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, color } = req.body;
    
    if (!color) {
      return res.status(400).json({ error: 'Label color is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)',
      [boardId, name || '', color]
    );
    
    const [label] = await pool.query('SELECT * FROM labels WHERE id = ?', [result.insertId]);
    res.status(201).json(label[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/labels/:id - Update a label
router.put('/labels/:id', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    
    values.push(req.params.id);
    await pool.query(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [label] = await pool.query('SELECT * FROM labels WHERE id = ?', [req.params.id]);
    res.json(label[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/labels/:id - Delete a label
router.delete('/labels/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM labels WHERE id = ?', [req.params.id]);
    res.json({ message: 'Label deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/cards/:cardId/labels/:labelId - Add label to card
router.post('/cards/:cardId/labels/:labelId', async (req, res, next) => {
  try {
    const { cardId, labelId } = req.params;
    await pool.query(
      'INSERT IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)',
      [cardId, labelId]
    );
    res.json({ message: 'Label added to card' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cards/:cardId/labels/:labelId - Remove label from card
router.delete('/cards/:cardId/labels/:labelId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM card_labels WHERE card_id = ? AND label_id = ?',
      [req.params.cardId, req.params.labelId]
    );
    res.json({ message: 'Label removed from card' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
