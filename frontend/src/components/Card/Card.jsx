import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UPLOADS_BASE } from '../../api/api';

export default function CardComponent({ card, board, listId, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', cardId: card.id, listId: `list-${listId}` }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Get label objects from IDs
  const labels = (card.labelIds || [])
    .map(id => board?.labels?.find(l => l.id === id))
    .filter(Boolean);

  // Get member objects from IDs
  const members = (card.memberIds || [])
    .map(id => board?.members?.find(m => m.id === id))
    .filter(Boolean);

  // Due date badge
  function getDueBadge() {
    if (!card.due_date) return null;
    const due = new Date(card.due_date);
    const now = new Date();
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    let className = 'card-badge';
    if (card.due_complete) {
      className += ' badge-complete';
    } else if (diffMs < 0) {
      className += ' badge-overdue';
    } else if (diffHours < 24) {
      className += ' badge-due-soon';
    }

    const dateStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <span className={className} title={card.due_complete ? 'Complete' : diffMs < 0 ? 'Overdue' : `Due ${dateStr}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {dateStr}
      </span>
    );
  }

  // Checklist badge
  function getChecklistBadge() {
    if (!card.checklistTotal || card.checklistTotal === 0) return null;
    const isComplete = card.checklistCompleted === card.checklistTotal;
    return (
      <span className={`card-badge ${isComplete ? 'badge-complete' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        {card.checklistCompleted}/{card.checklistTotal}
      </span>
    );
  }

  // Comment badge
  function getCommentBadge() {
    if (!card.commentCount || card.commentCount === 0) return null;
    return (
      <span className="card-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {card.commentCount}
      </span>
    );
  }

  // Description badge
  function getDescriptionBadge() {
    if (!card.description) return null;
    return (
      <span className="card-badge" title="This card has a description">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
        </svg>
      </span>
    );
  }

  const hasBadges = card.due_date || card.checklistTotal > 0 || card.commentCount > 0 || card.description;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card ${isDragging ? 'is-dragging' : ''}`}
      onClick={onClick}
      id={`card-${card.id}`}
    >
      {/* Cover */}
      {card.cover_image ? (
        <div className="card-cover" style={{ 
          backgroundImage: `url(${card.cover_image.startsWith('http') ? card.cover_image : `${UPLOADS_BASE}/${card.cover_image.replace('/uploads/', '')}`})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '140px' 
        }} />
      ) : card.cover_color ? (
        <div className="card-cover" style={{ background: card.cover_color }} />
      ) : null}

      <div className="card-content">
        {/* Labels */}
        {labels.length > 0 && (
          <div className="card-labels">
            {labels.map(label => (
              <div
                key={label.id}
                className="card-label"
                style={{ background: label.color }}
                title={label.name || label.color}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <div className="card-title">{card.title}</div>

        {/* Badges */}
        {hasBadges && (
          <div className="card-badges">
            {getDueBadge()}
            {getDescriptionBadge()}
            {getChecklistBadge()}
            {getCommentBadge()}
          </div>
        )}

        {/* Members */}
        {members.length > 0 && (
          <div className="card-members">
            {members.slice(0, 3).map(member => (
              <div
                key={member.id}
                className="card-member-avatar"
                style={{ background: member.avatar_color }}
                title={member.name}
              >
                {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
            ))}
            {members.length > 3 && (
              <div className="card-member-avatar" style={{ background: 'var(--text-tertiary)' }}>
                +{members.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
