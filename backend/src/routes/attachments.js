const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/cards/:cardId/attachments - Upload an attachment
router.post('/cards/:cardId/attachments', upload.single('file'), async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if card exists
    const [cards] = await pool.query('SELECT id FROM cards WHERE id = ?', [cardId]);
    if (cards.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Insert into DB
    const [result] = await pool.query(
      'INSERT INTO attachments (card_id, file_name, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?)',
      [cardId, file.filename, file.originalname, file.mimetype, file.size]
    );
    
    const [attachment] = await pool.query('SELECT * FROM attachments WHERE id = ?', [result.insertId]);
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_log (card_id, member_id, action, details) VALUES (?, ?, ?, ?)',
      [cardId, 1, 'attached a file', file.originalname]
    );
    
    res.status(201).json(attachment[0]);
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

// DELETE /api/attachments/:id - Delete an attachment
router.delete('/attachments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [attachments] = await pool.query('SELECT * FROM attachments WHERE id = ?', [id]);
    if (attachments.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = attachments[0];
    
    // Check if this is the cover image for any card, if so null it out
    await pool.query(
      'UPDATE cards SET cover_image = NULL WHERE id = ? AND cover_image = ?',
      [attachment.card_id, `/uploads/${attachment.file_name}`]
    );
    
    // Delete from DB
    await pool.query('DELETE FROM attachments WHERE id = ?', [id]);
    
    // Delete file
    const filePath = path.join(uploadDir, attachment.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_log (card_id, member_id, action, details) VALUES (?, ?, ?, ?)',
      [attachment.card_id, 1, 'deleted attachment', attachment.original_name]
    );
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
