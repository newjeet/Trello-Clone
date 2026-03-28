import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardComponent from '../Card/Card';

export default function List({ list, board, filteredCardIds, onUpdateTitle, onDelete, onAddCard, onCardClick }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const titleRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleTitleBlur() {
    setEditingTitle(false);
    if (title.trim() && title !== list.title) {
      onUpdateTitle(list.id, title);
    } else {
      setTitle(list.title);
    }
  }

  async function handleAddCard(e) {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await onAddCard(list.id, newCardTitle);
    setNewCardTitle('');
  }

  // Filter visible cards
  const visibleCards = filteredCardIds
    ? list.cards.filter(c => filteredCardIds.has(c.id))
    : list.cards;

  return (
    <div ref={setNodeRef} style={style} className={`list ${isDragging ? 'is-dragging' : ''}`} id={`list-${list.id}`}>
      {/* List Header */}
      <div className="list-header" {...attributes} {...listeners}>
        {editingTitle ? (
          <input
            ref={titleRef}
            className="list-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setTitle(list.title); setEditingTitle(false); } }}
            autoFocus
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          />
        ) : (
          <div
            className="list-title"
            onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ cursor: 'text' }}
          >
            {list.title}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <button 
            className="list-menu-btn" 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
            </svg>
          </button>

          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
              <div className="list-menu" style={{ zIndex: 100 }}>
                <button className="list-menu-item" onClick={() => { setShowAddCard(true); setShowMenu(false); }}>
                  Add Card
                </button>
                <button className="list-menu-item" onClick={() => { setEditingTitle(true); setShowMenu(false); }}>
                  Rename List
                </button>
                <button className="list-menu-item danger" onClick={() => { setShowMenu(false); onDelete(list.id); }}>
                  Delete List
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={visibleCards.map(c => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
        <div className="list-cards">
          {visibleCards.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              board={board}
              listId={list.id}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card */}
      <div className="list-footer">
        {showAddCard ? (
          <form className="add-card-form" onSubmit={handleAddCard} style={{ padding: 0 }}>
            <textarea
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard(e);
                }
                if (e.key === 'Escape') {
                  setShowAddCard(false);
                  setNewCardTitle('');
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                minHeight: '54px',
                boxShadow: '0 1px 0 rgba(9,30,66,0.25)',
                lineHeight: '1.4'
              }}
            />
            <div className="add-card-form-actions">
              <button type="submit" className="btn btn-primary">Add Card</button>
              <button type="button" className="close-btn" onClick={() => { setShowAddCard(false); setNewCardTitle(''); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <button className="add-card-btn" onClick={() => setShowAddCard(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
