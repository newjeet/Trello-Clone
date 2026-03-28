import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  closestCenter,
  rectIntersection,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import * as api from '../../api/api';
import List from '../List/List';
import CardComponent from '../Card/Card';
import CardDetailModal from '../CardDetail/CardDetailModal';
import SearchBar from '../common/SearchBar';
import FilterBar from '../common/FilterBar';

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [filters, setFilters] = useState({});
  const [filteredCardIds, setFilteredCardIds] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showArchiveMenu, setShowArchiveMenu] = useState(false);
  const [archivedCards, setArchivedCards] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  async function loadBoard() {
    try {
      setLoading(true);
      const data = await api.getBoard(boardId);
      setBoard(data);
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  }

  const getNumericId = (id) => {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      const parts = id.split('-');
      return parts.length > 1 ? parseInt(parts[1]) : id;
    }
    return id;
  };

  // Find which list a card belongs to
  function findListByCardId(cardId) {
    if (!board) return null;
    const cid = getNumericId(cardId);
    return board.lists.find(list => list.cards.some(c => c.id === cid));
  }

  function findCardById(cardId) {
    if (!board) return null;
    const cid = getNumericId(cardId);
    for (const list of board.lists) {
      const card = list.cards.find(c => c.id === cid);
      if (card) return card;
    }
    return null;
  }

  // DnD handlers
  function handleDragStart(event) {
    const { active } = event;
    const type = active.data?.current?.type;
    setActiveId(active.id);
    setActiveType(type);
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over || !board) return;

    const activeType = active.data?.current?.type;
    
    // Handle List Reordering (Sliding Effect)
    if (activeType === 'list') {
      if (active.id !== over.id) {
        setBoard(prev => {
          const oldIndex = prev.lists.findIndex(l => `list-${l.id}` === active.id);
          
          let overId = over.id;
          if (over.data?.current?.type === 'card') {
            overId = over.data?.current?.listId;
          }
          
          const newIndex = prev.lists.findIndex(l => `list-${l.id}` === overId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            return { ...prev, lists: arrayMove(prev.lists, oldIndex, newIndex) };
          }
          return prev;
        });
      }
      return;
    }

    if (activeType !== 'card') return;

    const activeListId = getNumericId(active.data?.current?.listId);
    let overListId;

    if (over.data?.current?.type === 'card') {
      overListId = getNumericId(over.data?.current?.listId);
    } else if (over.data?.current?.type === 'list') {
      overListId = getNumericId(over.id);
    } else {
      return;
    }

    if (activeListId === overListId) {
      if (active.id !== over.id) {
        setBoard(prev => {
          const listIndex = prev.lists.findIndex(l => l.id === activeListId);
          if (listIndex === -1) return prev;
          
          const list = prev.lists[listIndex];
          const activeNumericId = getNumericId(active.id);
          const overNumericId = getNumericId(over.id);
          const oldIndex = list.cards.findIndex(c => c.id === activeNumericId);
          const newIndex = list.cards.findIndex(c => c.id === overNumericId);
          
          const newCards = arrayMove(list.cards, oldIndex, newIndex);
          const newLists = [...prev.lists];
          newLists[listIndex] = { ...list, cards: newCards };
          
          return { ...prev, lists: newLists };
        });
      }
      return;
    }

    setBoard(prev => {
      const newBoard = { ...prev, lists: prev.lists.map(l => ({ ...l, cards: [...l.cards] })) };
      const sourceList = newBoard.lists.find(l => l.id === activeListId);
      const destList = newBoard.lists.find(l => l.id === overListId);
      if (!sourceList || !destList) return prev;

      const activeNumericId = getNumericId(active.id);
      const cardIndex = sourceList.cards.findIndex(c => c.id === activeNumericId);
      if (cardIndex === -1) return prev;

      const [card] = sourceList.cards.splice(cardIndex, 1);

      if (over.data?.current?.type === 'card') {
        const overNumericId = getNumericId(over.id);
        const overIndex = destList.cards.findIndex(c => c.id === overNumericId);
        destList.cards.splice(overIndex, 0, card);
      } else {
        destList.cards.push(card);
      }

      // Update the active card's data reference
      active.data.current.listId = `list-${overListId}`;

      return newBoard;
    });
  }

  // Custom collision detection for nested sortables
  const collisionDetectionStrategy = useCallback((args) => {
    if (activeType === 'list') {
      return closestCenter(args);
    }
    
    // For cards, first check intersection
    const intersections = rectIntersection(args);
    if (intersections.length > 0) return intersections;
    
    // Fallback to closest corners
    return closestCorners(args);
  }, [activeType]);

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!board) return;

    if (active.data?.current?.type === 'list') {
      // Always save the currently reflected list order to the backend
      const updates = board.lists.map((list, i) => ({ id: list.id, position: (i + 1) * 1000 }));
      
      try {
        await api.reorderLists(updates);
      } catch (err) {
        console.error('Failed to save list order:', err);
        loadBoard();
      }
      return;
    }

    if (!over) return;
    
    if (active.data?.current?.type === 'card') {
      const overId = over.id;
      const overType = over.data?.current?.type;
      
      let overListId;
      if (overType === 'card') {
        overListId = getNumericId(over.data.current.listId);
      } else {
        overListId = getNumericId(overId);
      }

      if (!overListId) return;

      const list = board.lists.find(l => l.id === overListId);
      if (!list) return;

      try {
        // Prepare updates for the whole list to maintain order
        const updates = list.cards.map((card, i) => ({
          id: card.id,
          list_id: overListId,
          position: (i + 1) * 1000
        }));
        await api.reorderCards(updates);
      } catch (err) {
        console.error('Failed to reorder cards:', err);
        loadBoard();
      }
    }
  }

  // List operations
  async function handleAddList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const newList = await api.createList(boardId, { title: newListTitle });
      setBoard(prev => ({ ...prev, lists: [...prev.lists, newList] }));
      setNewListTitle('');
      setShowAddList(false);
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  }

  async function handleUpdateListTitle(listId, title) {
    try {
      await api.updateList(listId, { title });
      setBoard(prev => ({
        ...prev, 
        lists: prev.lists.map(l => l.id === listId ? { ...l, title } : l)
      }));
    } catch (err) {
      console.error('Failed to update list:', err);
    }
  }

  async function handleDeleteList(listId) {
    if (!confirm('Delete this list and all its cards?')) return;
    try {
      await api.deleteList(listId);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.filter(l => l.id !== listId)
      }));
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  }

  // Card operations
  async function handleAddCard(listId, title) {
    try {
      const newCard = await api.createCard(listId, { title });
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => 
          l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
        )
      }));
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  }

  async function handleArchiveCard(cardId) {
    try {
      await api.updateCard(cardId, { archived: true });
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.filter(c => c.id !== cardId)
        }))
      }));
      setSelectedCardId(null);
    } catch (err) {
      console.error('Failed to archive card:', err);
    }
  }

  async function handleDeleteCard(cardId) {
    try {
      await api.deleteCard(cardId);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.filter(c => c.id !== cardId)
        }))
      }));
      setSelectedCardId(null);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  }

// Board title update
  async function handleUpdateTitle(newTitle) {
    if (!newTitle.trim() || newTitle === board.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await api.updateBoard(boardId, { title: newTitle });
      setBoard(prev => ({ ...prev, title: newTitle }));
    } catch (err) {
      console.error('Failed to update board title:', err);
    }
    setEditingTitle(false);
  }

  // Board background update
  async function handleChangeBackground(bg) {
    try {
      await api.updateBoard(boardId, { background: bg });
      setBoard(prev => ({ ...prev, background: bg }));
      setShowBgMenu(false);
    } catch (err) {
      console.error('Failed to update board background:', err);
    }
  }

  // Archives
  async function loadArchivedCards() {
    try {
      const cards = await api.getArchivedCards(boardId);
      setArchivedCards(cards);
    } catch (err) {
      console.error('Failed to load archived cards:', err);
    }
  }

  async function handleUnarchiveCard(cardId) {
    try {
      await api.updateCard(cardId, { archived: false });
      setArchivedCards(prev => prev.filter(c => c.id !== cardId));
      loadBoard();
    } catch (err) {
      console.error('Failed to unarchive card:', err);
    }
  }

  async function handleDeleteArchivedCard(cardId) {
    if (!confirm('Permanently delete this card?')) return;
    try {
      await api.deleteCard(cardId);
      setArchivedCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Failed to delete archived card:', err);
    }
  }

  // Search
  async function handleSearch(query) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await api.searchCards(boardId, query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  // Filter
  async function handleFilter(newFilters) {
    setFilters(newFilters);
    const hasFilters = newFilters.labels?.length || newFilters.members?.length || newFilters.due;
    
    if (!hasFilters) {
      setFilteredCardIds(null);
      return;
    }

    try {
      const results = await api.filterCards(boardId, newFilters);
      setFilteredCardIds(new Set(results.map(c => c.id)));
    } catch (err) {
      console.error('Filter failed:', err);
    }
  }

  function onCardUpdated() {
    loadBoard();
  }

  if (loading) {
    return (
      <div style={{ 
        background: 'var(--bg-board)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px'
      }}>
        Loading board...
      </div>
    );
  }

  if (!board) {
    return (
      <div style={{ 
        background: 'var(--bg-board)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px'
      }}>
        Board not found. <button onClick={() => navigate('/')} className="btn btn-primary" style={{marginLeft: 16}}>Go Home</button>
      </div>
    );
  }

  const activeCard = activeType === 'card' ? findCardById(activeId) : null;

  return (
    <div className="board-view" style={{ background: board.background, minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="app-navbar">
        <div className="app-navbar-left">
          <button className="navbar-btn" onClick={() => navigate('/')} id="home-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="12" rx="1.5"/></svg>
            <span className="btn-text">Boards</span>
          </button>
        </div>
        <span className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="12" rx="1.5"/></svg>
          TrelloClone
        </span>
        <div className="app-navbar-right" />
      </nav>

      {/* Board Header */}
      <div className="board-header">
        <div className="board-header-left">
          <input
            className="board-title"
            value={board.title}
            onChange={e => setBoard(prev => ({ ...prev, title: e.target.value }))}
            onBlur={e => handleUpdateTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
            id="board-title-input"
          />
        </div>
        <div className="board-header-right">
          <FilterBar 
            labels={board.labels}
            members={board.members}
            filters={filters}
            onFilter={handleFilter}
          />
          <div className="board-header-divider" />
          <button className="board-header-btn" onClick={() => setShowBgMenu(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/></svg>
            <span className="btn-text">Background</span>
          </button>
          <button className="board-header-btn" onClick={() => { loadArchivedCards(); setShowArchiveMenu(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            <span className="btn-text">Archive</span>
          </button>
          <SearchBar 
            boardId={boardId}
            onSearch={handleSearch}
            searchResults={searchResults}
            onSelectCard={setSelectedCardId}
            onClearResults={() => setSearchResults(null)}
          />
        </div>
      </div>

      {/* Lists Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={board.lists.map(l => `list-${l.id}`)} 
          strategy={horizontalListSortingStrategy}
        >
          <div className="lists-container">
            {board.lists.map(list => (
              <List
                key={list.id}
                list={list}
                board={board}
                filteredCardIds={filteredCardIds}
                onUpdateTitle={handleUpdateListTitle}
                onDelete={handleDeleteList}
                onAddCard={handleAddCard}
                onCardClick={setSelectedCardId}
              />
            ))}

            {/* Add List */}
            <div className="add-list">
              {showAddList ? (
                <form className="add-list-form" onSubmit={handleAddList}>
                  <input
                    value={newListTitle}
                    onChange={e => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    autoFocus
                    onBlur={() => { if (!newListTitle.trim()) setShowAddList(false); }}
                  />
                  <div className="add-list-form-actions">
                    <button type="submit" className="btn btn-primary">Add List</button>
                    <button type="button" className="close-btn" onClick={() => { setShowAddList(false); setNewListTitle(''); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </form>
              ) : (
                <button className="add-list-btn" onClick={() => setShowAddList(true)} id="add-list-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add another list
                </button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeType === 'card' && activeCard ? (
            <div className="drag-overlay-card">
              <CardComponent card={activeCard} board={board} />
            </div>
          ) : null}
          {activeId && activeType === 'list' ? (
            <div className="drag-overlay-list">
              {(() => {
                const list = board.lists.find(l => `list-${l.id}` === activeId);
                if (!list) return null;
                return (
                  <div className="list" style={{ opacity: 0.8 }}>
                    <div className="list-header">
                      <span className="list-title" style={{ cursor: 'grabbing' }}>{list.title}</span>
                    </div>
                    <div className="list-cards" style={{ maxHeight: '200px', overflow: 'hidden' }}>
                      {list.cards.slice(0, 3).map(card => (
                        <CardComponent key={card.id} card={card} board={board} />
                      ))}
                      {list.cards.length > 3 && (
                        <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          +{list.cards.length - 3} more cards
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          board={board}
          onClose={() => { setSelectedCardId(null); onCardUpdated(); }}
          onArchive={handleArchiveCard}
          onDelete={handleDeleteCard}
        />
      )}

      {/* Background Menu Modal */}
      {showBgMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowBgMenu(false)} />
          <div className="popover" style={{ position: 'absolute', top: '90px', right: '16px', zIndex: 400, width: '300px' }}>
            <div className="popover-header">
              <h4>Board Background</h4>
              <button className="popover-close" onClick={() => setShowBgMenu(false)}>×</button>
            </div>
            <div className="popover-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['#0079BF', '#D29034', '#519839', '#B04632', '#89609E'].map(c => (
                  <div key={c} onClick={() => handleChangeBackground(c)} style={{ height: '64px', background: c, borderRadius: '4px', cursor: 'pointer' }} />
                ))}
                {['linear-gradient(135deg, #0079BF 0%, #5067C5 100%)', 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)'].map((c, i) => (
                  <div key={i} onClick={() => handleChangeBackground(c)} style={{ height: '64px', background: c, borderRadius: '4px', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Archived Cards Modal */}
      {showArchiveMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowArchiveMenu(false)} />
          <div className="popover" style={{ position: 'absolute', top: '90px', right: '16px', zIndex: 400, width: '340px' }}>
            <div className="popover-header">
              <h4>Archived Cards</h4>
              <button className="popover-close" onClick={() => setShowArchiveMenu(false)}>×</button>
            </div>
            <div className="popover-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {archivedCards.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No archived cards</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {archivedCards.map(c => (
                    <div key={c.id} style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>In list: {c.list_title}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }} onClick={() => handleUnarchiveCard(c.id)}>Send to board</button>
                        <button className="btn btn-danger" style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }} onClick={() => handleDeleteArchivedCard(c.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
