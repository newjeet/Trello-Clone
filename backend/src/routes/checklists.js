const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/cards/:cardId/checklists - Create a checklist
router.post('/cards/:cardId/checklists', async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { title } = req.body;
    
    const [maxPos] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM checklists WHERE card_id = ?',
      [cardId]
    );
    
    const [result] = await pool.query(
      'INSERT INTO checklists (card_id, title, position) VALUES (?, ?, ?)',
      [cardId, title || 'Checklist', maxPos[0].maxPos + 1000]
    );
    
    const [checklist] = await pool.query('SELECT * FROM checklists WHERE id = ?', [result.insertId]);
    checklist[0].items = [];
    res.status(201).json(checklist[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/checklists/:id - Update checklist title
router.put('/checklists/:id', async (req, res, next) => {
  try {
    const { title } = req.body;
    await pool.query('UPDATE checklists SET title = ? WHERE id = ?', [title, req.params.id]);
    const [checklist] = await pool.query('SELECT * FROM checklists WHERE id = ?', [req.params.id]);
    res.json(checklist[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/checklists/:id - Delete a checklist
router.delete('/checklists/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM checklists WHERE id = ?', [req.params.id]);
    res.json({ message: 'Checklist deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/checklists/:checklistId/items - Add checklist item
router.post('/checklists/:checklistId/items', async (req, res, next) => {
  try {
    const { checklistId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Item title is required' });
    }
    
    const [maxPos] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM checklist_items WHERE checklist_id = ?',
      [checklistId]
    );
    
    const [result] = await pool.query(
      'INSERT INTO checklist_items (checklist_id, title, position) VALUES (?, ?, ?)',
      [checklistId, title.trim(), maxPos[0].maxPos + 1000]
    );
    
    const [item] = await pool.query('SELECT * FROM checklist_items WHERE id = ?', [result.insertId]);
    res.status(201).json(item[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/checklist-items/:id - Update item
router.put('/checklist-items/:id', async (req, res, next) => {
  try {
    const { title, completed } = req.body;
    const updates = [];
    const values = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (completed !== undefined) { updates.push('completed = ?'); values.push(completed); }
    
    values.push(req.params.id);
    await pool.query(`UPDATE checklist_items SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [item] = await pool.query('SELECT * FROM checklist_items WHERE id = ?', [req.params.id]);
    res.json(item[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/checklist-items/:id - Delete item
router.delete('/checklist-items/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM checklist_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
