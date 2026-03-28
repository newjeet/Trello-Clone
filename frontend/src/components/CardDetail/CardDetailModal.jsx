import { useState, useEffect, useRef } from 'react';
import * as api from '../../api/api';
import { UPLOADS_BASE } from '../../api/api';

const COVER_COLORS = ['#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46', '#C377E0', '#0079BF', '#00C2E0', '#51E898', '#FF78CB', '#344563'];

export default function CardDetailModal({ cardId, board, onClose, onArchive, onDelete }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  const [showLabelsPopover, setShowLabelsPopover] = useState(false);
  const [showMembersPopover, setShowMembersPopover] = useState(false);
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);
  const [showCoverPopover, setShowCoverPopover] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [dueDate, setDueDate] = useState('');
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  const overlayRef = useRef(null);
  const fileInputRef = useRef(null);

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  useEffect(() => {
    loadCard();
    loadComments();
    loadActivity();
  }, [cardId]);

  async function loadCard() {
    try {
      setLoading(true);
      const data = await api.getCard(cardId);
      setCard(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setDueDate(data.due_date ? new Date(data.due_date).toISOString().slice(0, 16) : '');
    } catch (err) {
      console.error('Failed to load card:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const data = await api.getComments(cardId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  }

  async function loadActivity() {
    try {
      const data = await api.getActivity(cardId);
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  }

  // Title
  async function handleTitleSave() {
    setEditingTitle(false);
    if (title.trim() && title !== card.title) {
      await api.updateCard(cardId, { title: title.trim() });
      setCard(prev => ({ ...prev, title: title.trim() }));
    }
  }

  // Description
  async function handleDescSave() {
    setEditingDesc(false);
    if (description !== (card.description || '')) {
      await api.updateCard(cardId, { description });
      setCard(prev => ({ ...prev, description }));
    }
  }

  // Labels
  async function toggleLabel(labelId) {
    const hasLabel = card.labels.some(l => l.id === labelId);
    try {
      if (hasLabel) {
        await api.removeLabelFromCard(cardId, labelId);
        setCard(prev => ({ ...prev, labels: (prev.labels || []).filter(l => l.id !== labelId) }));
      } else {
        await api.addLabelToCard(cardId, labelId);
        const label = board.labels.find(l => l.id === labelId);
        setCard(prev => ({ ...prev, labels: [...(prev.labels || []), label] }));
      }
    } catch (err) {
      console.error('Failed to toggle label:', err);
    }
  }

  // Members
  async function toggleMember(memberId) {
    const hasMember = card.members.some(m => m.id === memberId);
    try {
      if (hasMember) {
        await api.removeMemberFromCard(cardId, memberId);
        setCard(prev => ({ ...prev, members: (prev.members || []).filter(m => m.id !== memberId) }));
      } else {
        await api.addMemberToCard(cardId, memberId);
        const member = board.members.find(m => m.id === memberId);
        setCard(prev => ({ ...prev, members: [...(prev.members || []), member] }));
      }
    } catch (err) {
      console.error('Failed to toggle member:', err);
    }
  }

  // Due Date
  async function handleSetDueDate(e) {
    e.preventDefault();
    try {
      await api.updateCard(cardId, { due_date: dueDate || null, due_complete: false });
      setCard(prev => ({ ...prev, due_date: dueDate || null, due_complete: false }));
      setShowDatePopover(false);
    } catch (err) {
      console.error('Failed to set due date:', err);
    }
  }

  async function handleRemoveDueDate() {
    try {
      await api.updateCard(cardId, { due_date: null, due_complete: false });
      setCard(prev => ({ ...prev, due_date: null, due_complete: false }));
      setDueDate('');
      setShowDatePopover(false);
    } catch (err) {
      console.error('Failed to remove due date:', err);
    }
  }

  async function toggleDueComplete() {
    try {
      const newVal = !card.due_complete;
      await api.updateCard(cardId, { due_complete: newVal });
      setCard(prev => ({ ...prev, due_complete: newVal }));
    } catch (err) {
      console.error('Failed to toggle due date:', err);
    }
  }

  // Cover
  async function handleSetCover(color) {
    try {
      await api.updateCard(cardId, { cover_color: color });
      setCard(prev => ({ ...prev, cover_color: color }));
    } catch (err) {
      console.error('Failed to set cover:', err);
    }
  }

  async function handleRemoveCover() {
    try {
      await api.updateCard(cardId, { cover_color: null, cover_image: null });
      setCard(prev => ({ ...prev, cover_color: null, cover_image: null }));
      setShowCoverPopover(false);
    } catch (err) {
      console.error('Failed to remove cover:', err);
    }
  }

  // Checklist
  async function handleAddChecklist(e) {
    e.preventDefault();
    try {
      const checklist = await api.createChecklist(cardId, { title: newChecklistTitle });
      setCard(prev => ({ ...prev, checklists: [...(prev.checklists || []), checklist] }));
      setNewChecklistTitle('Checklist');
      setShowChecklistPopover(false);
    } catch (err) {
      console.error('Failed to add checklist:', err);
    }
  }

  async function handleDeleteChecklist(checklistId) {
    try {
      await api.deleteChecklist(checklistId);
      setCard(prev => ({
        ...prev,
        checklists: (prev.checklists || []).filter(c => c.id !== checklistId)
      }));
    } catch (err) {
      console.error('Failed to delete checklist:', err);
    }
  }

  async function handleAddItem(e, checklistId) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    try {
      const item = await api.addChecklistItem(checklistId, { title: newItemTitle });
      setCard(prev => ({
        ...prev,
        checklists: (prev.checklists || []).map(c =>
          c.id === checklistId ? { ...c, items: [...(c.items || []), item] } : c
        )
      }));
      setNewItemTitle('');
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  }

  async function handleToggleItem(itemId, completed) {
    try {
      await api.updateChecklistItem(itemId, { completed: !completed });
      setCard(prev => ({
        ...prev,
        checklists: prev.checklists.map(c => ({
          ...c,
          items: c.items.map(i => i.id === itemId ? { ...i, completed: !completed } : i)
        }))
      }));
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  }

  async function handleDeleteItem(itemId) {
    try {
      await api.deleteChecklistItem(itemId);
      setCard(prev => ({
        ...prev,
        checklists: prev.checklists.map(c => ({
          ...c,
          items: c.items.filter(i => i.id !== itemId)
        }))
      }));
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  }

  // Attachments
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const attachment = await api.uploadAttachment(cardId, file);
      setCard(prev => ({
        ...prev,
        attachments: [attachment, ...(prev.attachments || [])]
      }));
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload file. Size limit is 10MB.');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeleteAttachment(attachmentId) {
    try {
      await api.deleteAttachment(attachmentId);
      setCard(prev => {
        const remaining = (prev.attachments || []).filter(a => a.id !== attachmentId);
        const attachment = (prev.attachments || []).find(a => a.id === attachmentId);
        let newCover = prev.cover_image;
        if (attachment && prev.cover_image === `${UPLOADS_BASE}/${attachment.file_name}`) {
          newCover = null;
        }
        return { ...prev, attachments: remaining, cover_image: newCover };
      });
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  }

  async function handleMakeCover(attachment) {
    try {
      const coverUrl = `${UPLOADS_BASE}/${attachment.file_name}`;
      await api.updateCard(cardId, { cover_image: coverUrl });
      setCard(prev => ({ ...prev, cover_image: coverUrl, cover_color: null }));
    } catch (err) {
      console.error('Failed to set cover image:', err);
    }
  }

  async function handleRemoveImageCover() {
    try {
      await api.updateCard(cardId, { cover_image: null });
      setCard(prev => ({ ...prev, cover_image: null }));
    } catch (err) {
      console.error('Failed to remove cover image:', err);
    }
  }

  // Comments
  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await api.addComment(cardId, { content: newComment, member_id: 1 });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  if (loading) {
    return (
      <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="card-detail-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="card-detail-modal" id="card-detail-modal">
        {/* Close */}
        <button className="card-detail-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Cover */}
        {card.cover_color && (
          <div className="card-detail-cover" style={{ background: card.cover_color }} />
        )}

        {/* Header */}
        <div className="card-detail-header">
          <div className="card-detail-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </div>

          {editingTitle ? (
            <textarea
              className="card-detail-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }}}
              autoFocus
              rows={1}
            />
          ) : (
            <h2 className="card-detail-title" onClick={() => setEditingTitle(true)} style={{ cursor: 'pointer' }}>
              {card.title}
            </h2>
          )}

          <p className="card-detail-subtitle">
            in list <strong>{card.list?.title}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="card-detail-body">
          {/* Main Content */}
          <div className="card-detail-main">
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="card-detail-section">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Labels</div>
                <div className="detail-labels">
                  {card.labels.map(label => (
                    <div key={label.id} className="detail-label-pill" style={{ background: label.color }}>
                      {label.name || ''}
                    </div>
                  ))}
                  <div className="detail-label-pill" style={{ background: 'rgba(9,30,66,0.04)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 400, width: '32px', justifyContent: 'center' }} onClick={() => setShowLabelsPopover(true)}>
                    +
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {card.members && card.members.length > 0 && (
              <div className="card-detail-section">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Members</div>
                <div className="detail-members">
                  {card.members.map(member => (
                    <div key={member.id} className="detail-member" title={member.name}>
                      <div className="detail-member-avatar" style={{ background: member.avatar_color }}>
                        {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                    </div>
                  ))}
                  <div className="detail-member" onClick={() => setShowMembersPopover(true)}>
                    <div className="detail-member-avatar" style={{ background: 'rgba(9,30,66,0.08)', color: 'var(--text-secondary)', fontSize: '16px' }}>+</div>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date */}
            {card.due_date && (
              <div className="card-detail-section">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Due Date</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={card.due_complete} onChange={toggleDueComplete} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}/>
                  <span className={`due-date-badge ${card.due_complete ? 'badge-complete' : new Date(card.due_date) < new Date() ? 'badge-overdue' : ''}`}
                    style={{ background: card.due_complete ? 'var(--label-green)' : new Date(card.due_date) < new Date() ? 'var(--label-red)' : 'rgba(9,30,66,0.08)', color: card.due_complete || new Date(card.due_date) < new Date() ? 'white' : 'var(--text-primary)' }}
                  >
                    {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' at '}
                    {new Date(card.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {card.due_complete && ' ✓ Complete'}
                    {!card.due_complete && new Date(card.due_date) < new Date() && ' ⚠ Overdue'}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card-detail-section">
              <div className="card-detail-section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                <h3>Description</h3>
              </div>

              {editingDesc ? (
                <div>
                  <textarea
                    className="description-textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    autoFocus
                    placeholder="Add a more detailed description..."
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    <button className="btn btn-primary" onClick={handleDescSave}>Save</button>
                    <button className="btn btn-subtle" onClick={() => { setEditingDesc(false); setDescription(card.description || ''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`card-description-editor ${description ? 'has-content' : ''}`}
                  onClick={() => setEditingDesc(true)}
                >
                  {description || 'Add a more detailed description...'}
                </div>
              )}
            </div>

            {/* Checklists */}
            {card.checklists && card.checklists.map(checklist => {
              const total = checklist.items.length;
              const completed = checklist.items.filter(i => i.completed).length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={checklist.id} className="card-detail-section checklist">
                  <div className="checklist-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <h4>{checklist.title}</h4>
                    </div>
                    <button className="btn btn-subtle" onClick={() => handleDeleteChecklist(checklist.id)}>Delete</button>
                  </div>

                  <div className="checklist-progress">
                    <div className="checklist-progress-text">{percent}%</div>
                    <div className="checklist-progress-bar">
                      <div className={`checklist-progress-fill ${percent === 100 ? 'complete' : ''}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {checklist.items.map(item => (
                    <div key={item.id} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(item.id, item.completed)}
                      />
                      <span className={`checklist-item-text ${item.completed ? 'completed' : ''}`}>
                        {item.title}
                      </span>
                      <button className="checklist-item-delete btn-icon" onClick={() => handleDeleteItem(item.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}

                  {/* Add item form */}
                  {addingItemTo === checklist.id ? (
                    <form onSubmit={e => handleAddItem(e, checklist.id)} style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        value={newItemTitle}
                        onChange={e => setNewItemTitle(e.target.value)}
                        placeholder="Add an item..."
                        autoFocus
                        style={{ width: '100%', padding: '6px 8px', border: '2px solid var(--border-focus)', borderRadius: '3px', outline: 'none', fontSize: '14px' }}
                        onKeyDown={e => { if (e.key === 'Escape') { setAddingItemTo(null); setNewItemTitle(''); }}}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button type="submit" className="btn btn-primary">Add</button>
                        <button type="button" className="btn btn-subtle" onClick={() => { setAddingItemTo(null); setNewItemTitle(''); }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button className="checklist-add-item-btn" onClick={() => { setAddingItemTo(checklist.id); setNewItemTitle(''); }}>
                      Add an item
                    </button>
                  )}
                </div>
              );
            })}

            {/* Attachments */}
            {card.attachments && card.attachments.length > 0 && (
              <div className="card-detail-section">
                <div className="card-detail-section-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <h3>Attachments</h3>
                </div>
                <div className="attachments-list">
                  {card.attachments.map(attachment => {
                    const isImage = attachment.mime_type?.startsWith('image/');
                    return (
                      <div key={attachment.id} className="attachment-item" style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                        <a href={`${UPLOADS_BASE}/${attachment.file_name}`} target="_blank" rel="noopener noreferrer" 
                           style={{ width: '112px', height: '80px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
                          {isImage ? (
                            <img src={`${UPLOADS_BASE}/${attachment.file_name}`} alt={attachment.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#5e6c84' }}>{attachment.original_name.split('.').pop().toUpperCase()}</span>
                          )}
                        </a>
                        <div className="attachment-details" style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#172b4d', wordBreak: 'break-word' }}>{attachment.original_name}</div>
                          <div style={{ fontSize: '14px', color: '#5e6c84', margin: '4px 0' }}>
                            Added {new Date(attachment.created_at).toLocaleDateString()} • {formatBytes(attachment.size)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-subtle" style={{ padding: '0', textDecoration: 'underline' }} onClick={() => handleDeleteAttachment(attachment.id)}>Delete</button>
                            {isImage && (
                              <button 
                                className="btn btn-subtle" 
                                style={{ padding: '0', textDecoration: 'underline' }} 
                                onClick={() => card.cover_image === `${UPLOADS_BASE}/${attachment.file_name}` ? handleRemoveCover() : handleMakeCover(attachment)}
                              >
                                {card.cover_image === `${UPLOADS_BASE}/${attachment.file_name}` ? 'Remove Cover' : 'Make Cover'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="card-detail-section">
              <div className="card-detail-section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>Comments</h3>
              </div>

              <form onSubmit={handleAddComment} className="comment-input-box">
                <div className="comment-avatar" style={{ background: '#0079BF' }}>AJ</div>
                <div style={{ flex: 1 }}>
                  <textarea
                    className="comment-input"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); }}}
                    rows={1}
                  />
                  {newComment.trim() && (
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }}>Save</button>
                  )}
                </div>
              </form>

              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-avatar" style={{ background: comment.member_avatar_color }}>
                    {comment.member_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{comment.member_name}</span>
                      <span className="comment-time">{formatDate(comment.created_at)}</span>
                    </div>
                    <div className="comment-text">{comment.content}</div>
                    <button className="btn btn-subtle" style={{ fontSize: '12px', padding: '2px 4px', marginTop: '4px' }} onClick={() => handleDeleteComment(comment.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Section */}
            {activity.length > 0 && (
              <div className="card-detail-section">
                <div className="card-detail-section-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <h3>Activity</h3>
                </div>

                {activity.map(act => (
                  <div key={act.id} className="activity-item">
                    <div className="activity-avatar" style={{ background: act.member_avatar_color }}>
                      {act.member_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{act.member_name}</strong> {act.details}
                      </div>
                      <div className="activity-time">{formatDate(act.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card-detail-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Add to card</div>
              
              <button className="sidebar-btn" onClick={() => setShowMembersPopover(!showMembersPopover)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Members
              </button>

              <button className="sidebar-btn" onClick={() => setShowLabelsPopover(!showLabelsPopover)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Labels
              </button>

              <button className="sidebar-btn" onClick={() => setShowChecklistPopover(!showChecklistPopover)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Checklist
              </button>

              <button className="sidebar-btn" onClick={() => fileInputRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                Attachment
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

              <button className="sidebar-btn" onClick={() => setShowDatePopover(!showDatePopover)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Dates
              </button>

              <button className="sidebar-btn" onClick={() => setShowCoverPopover(!showCoverPopover)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                Cover
              </button>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Actions</div>
              <button className="sidebar-btn" onClick={() => onArchive(cardId)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                Archive
              </button>
              <button className="sidebar-btn" style={{ color: 'var(--label-red)' }} onClick={() => { if (confirm('Delete this card permanently?')) onDelete(cardId); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Popovers */}
        {showLabelsPopover && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowLabelsPopover(false)} />
            <div className="popover" style={{ position: 'absolute', top: '200px', right: '16px', zIndex: 400 }}>
              <div className="popover-header">
                <h4>Labels</h4>
                <button className="popover-close" onClick={() => setShowLabelsPopover(false)}>×</button>
              </div>
              <div className="popover-content">
                {board.labels.map(label => (
                  <div key={label.id} className="label-option" onClick={() => toggleLabel(label.id)}>
                    <div className="label-option-color" style={{ background: label.color }}>
                      {label.name}
                    </div>
                    <div className="label-option-check">
                      {card.labels.some(l => l.id === label.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showMembersPopover && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowMembersPopover(false)} />
            <div className="popover" style={{ position: 'absolute', top: '200px', right: '16px', zIndex: 400 }}>
              <div className="popover-header">
                <h4>Members</h4>
                <button className="popover-close" onClick={() => setShowMembersPopover(false)}>×</button>
              </div>
              <div className="popover-content">
                {board.members.map(member => (
                  <div key={member.id} className="member-option" onClick={() => toggleMember(member.id)}>
                    <div className="member-option-avatar" style={{ background: member.avatar_color }}>
                      {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <span className="member-option-name">{member.name}</span>
                    {card.members.some(m => m.id === member.id) && (
                      <span className="member-option-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showDatePopover && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowDatePopover(false)} />
            <div className="popover" style={{ position: 'absolute', top: '200px', right: '16px', zIndex: 400 }}>
              <div className="popover-header">
                <h4>Dates</h4>
                <button className="popover-close" onClick={() => setShowDatePopover(false)}>×</button>
              </div>
              <div className="popover-content">
                <form onSubmit={handleSetDueDate}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-danger" onClick={handleRemoveDueDate}>Remove</button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {showChecklistPopover && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowChecklistPopover(false)} />
            <div className="popover" style={{ position: 'absolute', top: '200px', right: '16px', zIndex: 400 }}>
              <div className="popover-header">
                <h4>Add Checklist</h4>
                <button className="popover-close" onClick={() => setShowChecklistPopover(false)}>×</button>
              </div>
              <div className="popover-content">
                <form onSubmit={handleAddChecklist}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={e => setNewChecklistTitle(e.target.value)}
                    autoFocus
                    style={{ marginBottom: '8px' }}
                  />
                  <button type="submit" className="btn btn-primary">Add</button>
                </form>
              </div>
            </div>
          </>
        )}

        {showCoverPopover && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowCoverPopover(false)} />
            <div className="popover" style={{ position: 'absolute', top: '200px', right: '16px', zIndex: 400 }}>
              <div className="popover-header">
                <h4>Cover</h4>
                <button className="popover-close" onClick={() => setShowCoverPopover(false)}>×</button>
              </div>
              <div className="popover-content">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {COVER_COLORS.map(color => (
                    <div
                      key={color}
                      style={{
                        width: '48px', height: '32px', borderRadius: '4px', background: color, cursor: 'pointer',
                        border: card.cover_color === color ? '2px solid var(--text-primary)' : '2px solid transparent'
                      }}
                      onClick={() => handleSetCover(color)}
                    />
                  ))}
                </div>
                {(card.cover_color || card.cover_image) && (
                  <button className="btn btn-secondary" onClick={handleRemoveCover} style={{ width: '100%', marginTop: '8px' }}>Remove Cover</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
