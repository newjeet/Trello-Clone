import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, deleteBoard } from '../../api/api';

const BG_OPTIONS = [
  'linear-gradient(135deg, #0079BF 0%, #5067C5 100%)',
  'linear-gradient(135deg, #D29034 0%, #E6A647 100%)',
  'linear-gradient(135deg, #519839 0%, #61BD4F 100%)',
  'linear-gradient(135deg, #B04632 0%, #EB5A46 100%)',
  'linear-gradient(135deg, #89609E 0%, #C377E0 100%)',
  'linear-gradient(135deg, #00AECC 0%, #00C2E0 100%)',
  'linear-gradient(135deg, #838C91 0%, #97A0AF 100%)',
  'linear-gradient(135deg, #CD5A91 0%, #FF78CB 100%)',
];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBg, setNewBg] = useState(BG_OPTIONS[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    try {
      const data = await getBoards();
      setBoards(data);
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await createBoard({ title: newTitle, background: newBg });
      setBoards([board, ...boards]);
      setNewTitle('');
      setShowCreate(false);
      navigate(`/board/${board.id}`);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  }

  async function handleDelete(e, boardId) {
    e.stopPropagation();
    if (!confirm('Delete this board and all its contents?')) return;
    try {
      await deleteBoard(boardId);
      setBoards(boards.filter(b => b.id !== boardId));
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="app-navbar" style={{ background: 'rgba(0, 121, 191, 0.95)' }}>
        <div className="app-navbar-left">
          <span className="navbar-logo">
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="12" rx="1.5"/></svg>
            TrelloClone
          </span>
        </div>
      </nav>

      {/* Boards Page */}
      <div className="boards-page">
        <div className="boards-page-header">
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Your Boards
          </h1>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading boards...</p>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map(board => (
              <div
                key={board.id}
                className="board-tile"
                style={{ background: board.background }}
                onClick={() => navigate(`/board/${board.id}`)}
                id={`board-tile-${board.id}`}
              >
                <div className="board-tile-title">{board.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div className="board-tile-meta">
                    {board.listCount || 0} lists · {board.cardCount || 0} cards
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, board.id)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      position: 'relative',
                      zIndex: 2
                    }}
                    title="Delete board"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <div className="board-tile-create" onClick={() => setShowCreate(true)} id="create-board-btn">
              + Create new board
            </div>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="create-board-modal" onClick={() => setShowCreate(false)}>
          <div className="create-board-content" onClick={e => e.stopPropagation()}>
            <h2>Create Board</h2>
            <form onSubmit={handleCreate}>
              <label htmlFor="board-title-input">Board Title *</label>
              <input
                id="board-title-input"
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter board title..."
                autoFocus
              />

              <label>Background</label>
              <div className="bg-options">
                {BG_OPTIONS.map((bg, i) => (
                  <div
                    key={i}
                    className={`bg-option ${newBg === bg ? 'selected' : ''}`}
                    style={{ background: bg }}
                    onClick={() => setNewBg(bg)}
                  />
                ))}
              </div>

              {/* Preview */}
              <div style={{
                background: newBg,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                height: '80px',
                display: 'flex',
                alignItems: 'flex-end'
              }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                  {newTitle || 'Board Preview'}
                </span>
              </div>

              <div className="create-board-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
