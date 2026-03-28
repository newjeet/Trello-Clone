const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/lists/:listId/cards - Create a card
router.post('/lists/:listId/cards', async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Card title is required' });
    }
    
    const [maxPos] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM cards WHERE list_id = ?',
      [listId]
    );
    
    const position = maxPos[0].maxPos + 1000;
    
    const [result] = await pool.query(
      'INSERT INTO cards (list_id, title, position) VALUES (?, ?, ?)',
      [listId, title.trim(), position]
    );
    
    const [card] = await pool.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
    card[0].labelIds = [];
    card[0].memberIds = [];
    card[0].checklistTotal = 0;
    card[0].checklistCompleted = 0;
    card[0].commentCount = 0;
    res.status(201).json(card[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/cards/reorder - Batch reorder cards (MUST be before :id route)
router.put('/cards/reorder', async (req, res, next) => {
  try {
    const { cards } = req.body; // Array of { id, list_id, position }
    
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Cards array is required' });
    }
    
    for (const item of cards) {
      await pool.query(
        'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
        [item.list_id, item.position, item.id]
      );
    }
    
    res.json({ message: 'Cards reordered' });
  } catch (err) {
    next(err);
  }
});

// GET /api/cards/:id - Get full card details
router.get('/cards/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    if (cards.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const card = cards[0];
    
    // Get labels
    const [labels] = await pool.query(
      `SELECT l.* FROM labels l
       JOIN card_labels cl ON l.id = cl.label_id
       WHERE cl.card_id = ?`,
      [id]
    );
    card.labels = labels;
    
    // Get members
    const [members] = await pool.query(
      `SELECT m.* FROM members m
       JOIN card_members cm ON m.id = cm.member_id
       WHERE cm.card_id = ?`,
      [id]
    );
    card.members = members;
    
    // Get checklists with items
    const [checklists] = await pool.query(
      'SELECT * FROM checklists WHERE card_id = ? ORDER BY position',
      [id]
    );
    
    for (const checklist of checklists) {
      const [items] = await pool.query(
        'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position',
        [checklist.id]
      );
      checklist.items = items;
    }
    // Get attachments
    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE card_id = ? ORDER BY created_at DESC',
      [id]
    );
    card.attachments = attachments;
    
    // Get list info
    const [listInfo] = await pool.query('SELECT id, title, board_id FROM lists WHERE id = ?', [card.list_id]);
    card.list = listInfo[0];
    
    res.json(card);
  } catch (err) {
    next(err);
  }
});

// PUT /api/cards/:id - Update card fields
router.put('/cards/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, cover_color, cover_image, due_date, due_complete, archived, list_id, position } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (cover_color !== undefined) { updates.push('cover_color = ?'); values.push(cover_color); }
    if (cover_image !== undefined) { updates.push('cover_image = ?'); values.push(cover_image); }
    if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
    if (due_complete !== undefined) { updates.push('due_complete = ?'); values.push(due_complete); }
    if (archived !== undefined) { updates.push('archived = ?'); values.push(archived); }
    if (list_id !== undefined) { updates.push('list_id = ?'); values.push(list_id); }
    if (position !== undefined) { updates.push('position = ?'); values.push(position); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    await pool.query(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [card] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    res.json(card[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/cards/:id/move - Move card to a different list/position
router.put('/cards/:id/move', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { list_id, position } = req.body;
    
    await pool.query(
      'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
      [list_id, position, id]
    );
    
    res.json({ message: 'Card moved' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cards/:id - Delete a card
router.delete('/cards/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
