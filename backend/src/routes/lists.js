const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/boards/:boardId/lists - Create a list
router.post('/boards/:boardId/lists', async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'List title is required' });
    }
    
    // Get the max position
    const [maxPos] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM lists WHERE board_id = ?',
      [boardId]
    );
    
    const position = maxPos[0].maxPos + 1000;
    
    const [result] = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [boardId, title.trim(), position]
    );
    
    const [list] = await pool.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
    list[0].cards = [];
    res.status(201).json(list[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/lists/reorder - Batch reorder lists (MUST be before :id route)
router.put('/lists/reorder', async (req, res, next) => {
  try {
    const { lists } = req.body; // Array of { id, position }
    
    if (!lists || !Array.isArray(lists)) {
      return res.status(400).json({ error: 'Lists array is required' });
    }
    
    for (const item of lists) {
      await pool.query('UPDATE lists SET position = ? WHERE id = ?', [item.position, item.id]);
    }
    
    res.json({ message: 'Lists reordered' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/lists/:id - Update a list
router.put('/lists/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, position, archived } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title.trim());
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    if (archived !== undefined) {
      updates.push('archived = ?');
      values.push(archived);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    await pool.query(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [list] = await pool.query('SELECT * FROM lists WHERE id = ?', [id]);
    res.json(list[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/lists/:id - Delete a list
router.delete('/lists/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM lists WHERE id = ?', [req.params.id]);
    res.json({ message: 'List deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
