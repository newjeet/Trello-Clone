const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Boards
export const getBoards = () => request('/boards');
export const getBoard = (id) => request(`/boards/${id}`);
export const getArchivedCards = (id) => request(`/boards/${id}/archived-cards`);
export const createBoard = (data) => request('/boards', { method: 'POST', body: data });
export const updateBoard = (id, data) => request(`/boards/${id}`, { method: 'PUT', body: data });
export const deleteBoard = (id) => request(`/boards/${id}`, { method: 'DELETE' });

// Lists
export const createList = (boardId, data) => request(`/boards/${boardId}/lists`, { method: 'POST', body: data });
export const updateList = (id, data) => request(`/lists/${id}`, { method: 'PUT', body: data });
export const deleteList = (id) => request(`/lists/${id}`, { method: 'DELETE' });
export const reorderLists = (lists) => request('/lists/reorder', { method: 'PUT', body: { lists } });

// Cards
export const createCard = (listId, data) => request(`/lists/${listId}/cards`, { method: 'POST', body: data });
export const getCard = (id) => request(`/cards/${id}`);
export const updateCard = (id, data) => request(`/cards/${id}`, { method: 'PUT', body: data });
export const deleteCard = (id) => request(`/cards/${id}`, { method: 'DELETE' });
export const moveCard = (id, data) => request(`/cards/${id}/move`, { method: 'PUT', body: data });
export const reorderCards = (cards) => request('/cards/reorder', { method: 'PUT', body: { cards } });

// Labels
export const getBoardLabels = (boardId) => request(`/boards/${boardId}/labels`);
export const createLabel = (boardId, data) => request(`/boards/${boardId}/labels`, { method: 'POST', body: data });
export const updateLabel = (id, data) => request(`/labels/${id}`, { method: 'PUT', body: data });
export const deleteLabel = (id) => request(`/labels/${id}`, { method: 'DELETE' });
export const addLabelToCard = (cardId, labelId) => request(`/cards/${cardId}/labels/${labelId}`, { method: 'POST' });
export const removeLabelFromCard = (cardId, labelId) => request(`/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' });

// Checklists
export const createChecklist = (cardId, data) => request(`/cards/${cardId}/checklists`, { method: 'POST', body: data });
export const updateChecklist = (id, data) => request(`/checklists/${id}`, { method: 'PUT', body: data });
export const deleteChecklist = (id) => request(`/checklists/${id}`, { method: 'DELETE' });
export const addChecklistItem = (checklistId, data) => request(`/checklists/${checklistId}/items`, { method: 'POST', body: data });
export const updateChecklistItem = (id, data) => request(`/checklist-items/${id}`, { method: 'PUT', body: data });
export const deleteChecklistItem = (id) => request(`/checklist-items/${id}`, { method: 'DELETE' });

// Attachments
export const uploadAttachment = async (cardId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/cards/${cardId}/attachments`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }
  
  return response.json();
};
export const deleteAttachment = (id) => request(`/attachments/${id}`, { method: 'DELETE' });

// Members
export const getMembers = () => request('/members');
export const addMemberToCard = (cardId, memberId) => request(`/cards/${cardId}/members/${memberId}`, { method: 'POST' });
export const removeMemberFromCard = (cardId, memberId) => request(`/cards/${cardId}/members/${memberId}`, { method: 'DELETE' });

// Comments
export const getComments = (cardId) => request(`/cards/${cardId}/comments`);
export const addComment = (cardId, data) => request(`/cards/${cardId}/comments`, { method: 'POST', body: data });
export const deleteComment = (id) => request(`/comments/${id}`, { method: 'DELETE' });

// Activity
export const getActivity = (cardId) => request(`/cards/${cardId}/activity`);

// Search & Filter
export const searchCards = (boardId, query) => request(`/boards/${boardId}/search?q=${encodeURIComponent(query)}`);
export const filterCards = (boardId, filters) => {
  const params = new URLSearchParams();
  if (filters.labels) params.set('labels', filters.labels.join(','));
  if (filters.members) params.set('members', filters.members.join(','));
  if (filters.due) params.set('due', filters.due);
  return request(`/boards/${boardId}/filter?${params.toString()}`);
};
