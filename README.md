# TrelloClone - Kanban Project Management Tool

A full-stack Trello-style Kanban board application built with React.js, Node.js/Express, and MySQL.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18 (Vite) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Routing** | React Router v6 |
| **Styling** | Vanilla CSS (Custom Design System) |
| **Font** | Inter (Google Fonts) |

### 🎮 Interactive Demo
![Drag and Drop Demo](file:///C:/Users/india/.gemini/antigravity/brain/978e9edb-0b7b-4362-a2a2-c524b8517a5c/trello_drag_and_drop_demo_final_2026_03_29_1774738137060.webp)

---

## 📋 Features

### Core Features
- ✅ **Board Management** - Create, edit, delete boards with custom backgrounds
- ✅ **Lists Management** - Create, edit, delete lists with drag-and-drop reordering
- ✅ **Cards Management** - Full CRUD with drag-and-drop between lists and within lists
- ✅ **Card Details** - Labels, due dates, checklists, member assignment
- ✅ **Search & Filter** - Search cards by title, filter by labels/members/due dates

### Bonus Features
- ✅ **Responsive Design** - Mobile, tablet, and desktop support
- ✅ **Multiple Boards** - Support for unlimited boards
- ✅ **Comments** - Activity log and comment system on cards
- ✅ **Card Covers** - Colored card covers
- ✅ **Board Backgrounds** - Gradient background customization
- ✅ **Activity Log** - Track card changes and actions

## 🗂️ Database Schema

The database consists of 11 tables with proper foreign key constraints and indexes:

- `members` — Pre-seeded users (no auth required)
- `boards` — Project boards with customizable backgrounds
- `lists` — Kanban columns within boards (ordered by position)
- `cards` — Task cards within lists (ordered by position)
- `labels` — Board-level colored labels
- `card_labels` — Junction table for card-label assignments
- `card_members` — Junction table for card-member assignments
- `checklists` — Checklists attached to cards
- `checklist_items` — Individual items within checklists
- `comments` — User comments on cards
- `activity_log` — Activity tracking for cards

**Key Design Decision:** Positions use `DOUBLE` type to enable inserting items between existing ones without re-indexing (e.g., insert between 1.0 and 2.0 → 1.5).

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** v18+ 
- **MySQL** 8.0+
- **npm** v9+

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Database

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trello_clone
DB_PORT=3306
PORT=5000
```

### 3. Set Up Database

```bash
cd backend

# Create database and tables
npm run db:setup

# Seed with sample data
npm run db:seed
```

### 4. Start the Application

```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

## 📁 Project Structure

```
Trello_antigravity/
├── backend/
│   ├── package.json
│   ├── .env                    # Database config
│   └── src/
│       ├── index.js            # Express server
│       ├── db.js               # MySQL connection pool
│       ├── schema.sql          # Database schema
│       ├── setupDb.js          # DB creation script
│       ├── seed.js             # Sample data seeder
│       ├── middleware/
│       │   └── errorHandler.js
│       └── routes/
│           ├── boards.js       # Board CRUD + aggregation
│           ├── lists.js        # List CRUD + reorder
│           ├── cards.js        # Card CRUD + move/reorder
│           ├── labels.js       # Label CRUD + card-label assignments
│           ├── checklists.js   # Checklist + item CRUD
│           ├── members.js      # Member listing + card-member assignments
│           ├── comments.js     # Comments + activity log
│           └── search.js       # Search + filter
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css           # Complete design system
│       ├── api/
│       │   └── api.js          # API client
│       └── components/
│           ├── BoardsPage/
│           │   └── BoardsPage.jsx
│           ├── BoardView/
│           │   └── BoardView.jsx
│           ├── List/
│           │   └── List.jsx
│           ├── Card/
│           │   └── Card.jsx
│           ├── CardDetail/
│           │   └── CardDetailModal.jsx
│           └── common/
│               ├── SearchBar.jsx
│               └── FilterBar.jsx
└── README.md
```

## 🧑‍💻 API Endpoints

### Boards
- `GET /api/boards` — List all boards
- `POST /api/boards` — Create a board
- `GET /api/boards/:id` — Get board with all data
- `PUT /api/boards/:id` — Update board
- `DELETE /api/boards/:id` — Delete board

### Lists
- `POST /api/boards/:boardId/lists` — Create list
- `PUT /api/lists/:id` — Update list
- `PUT /api/lists/reorder` — Reorder lists
- `DELETE /api/lists/:id` — Delete list

### Cards
- `POST /api/lists/:listId/cards` — Create card
- `GET /api/cards/:id` — Get card details
- `PUT /api/cards/:id` — Update card
- `PUT /api/cards/:id/move` — Move card
- `PUT /api/cards/reorder` — Reorder cards
- `DELETE /api/cards/:id` — Delete card

### Labels, Checklists, Members, Comments, Search
Full REST endpoints available for all features.
npm install
# Set VITE_API_BASE_URL in .env
npm run dev
```

---

## 📄 License
MIT License - Created for Demonstration Purposes.
