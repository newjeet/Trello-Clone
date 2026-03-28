const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/members - Get all members
router.get('/', async (req, res, next) => {
  try {
    const [members] = await pool.query('SELECT * FROM members ORDER BY name');
    res.json(members);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
