const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');
const labelRoutes = require('./routes/labels');
const checklistRoutes = require('./routes/checklists');
const memberRoutes = require('./routes/members');
const cardMemberRoutes = require('./routes/cardMembers');
const commentRoutes = require('./routes/comments');
const attachmentRoutes = require('./routes/attachments');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/boards', boardRoutes);
app.use('/api', listRoutes);
app.use('/api', cardRoutes);
app.use('/api', labelRoutes);
app.use('/api', checklistRoutes);
app.use('/api/members', memberRoutes);
app.use('/api', cardMemberRoutes);
app.use('/api', commentRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Root check for Render
app.get('/', (req, res) => {
  res.send('Trello Clone API is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
