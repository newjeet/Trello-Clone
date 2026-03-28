import { useState, useRef, useEffect } from 'react';

export default function FilterBar({ labels, members, filters, onFilter }) {
  const [showLabelFilter, setShowLabelFilter] = useState(false);
  const [showMemberFilter, setShowMemberFilter] = useState(false);
  const [showDueFilter, setShowDueFilter] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState(filters.labels || []);
  const [selectedMembers, setSelectedMembers] = useState(filters.members || []);
  const [selectedDue, setSelectedDue] = useState(filters.due || '');

  const hasFilters = selectedLabels.length > 0 || selectedMembers.length > 0 || selectedDue;

  function toggleLabel(labelId) {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    setSelectedLabels(next);
    onFilter({ labels: next, members: selectedMembers, due: selectedDue });
  }

  function toggleMember(memberId) {
    const next = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    setSelectedMembers(next);
    onFilter({ labels: selectedLabels, members: next, due: selectedDue });
  }

  function selectDue(value) {
    const next = selectedDue === value ? '' : value;
    setSelectedDue(next);
    onFilter({ labels: selectedLabels, members: selectedMembers, due: next });
  }

  function clearFilters() {
    setSelectedLabels([]);
    setSelectedMembers([]);
    setSelectedDue('');
    onFilter({});
  }

  return (
    <div className="filter-bar">
      {/* Label Filter */}
      <div style={{ position: 'relative' }}>
        <button
          className={`filter-btn ${selectedLabels.length > 0 ? 'active' : ''}`}
          onClick={() => { setShowLabelFilter(!showLabelFilter); setShowMemberFilter(false); setShowDueFilter(false); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          </svg>
          <span className="btn-text">Labels {selectedLabels.length > 0 && `(${selectedLabels.length})`}</span>
        </button>

        {showLabelFilter && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowLabelFilter(false)} />
            <div className="popover" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 100 }}>
              <div className="popover-header">
                <h4>Filter by Label</h4>
                <button className="popover-close" onClick={() => setShowLabelFilter(false)}>×</button>
              </div>
              <div className="popover-content">
                {labels?.map(label => (
                  <div key={label.id} className="label-option" onClick={() => toggleLabel(label.id)}>
                    <div className="label-option-color" style={{ background: label.color }}>
                      {label.name}
                    </div>
                    <div className="label-option-check">
                      {selectedLabels.includes(label.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Member Filter */}
      <div style={{ position: 'relative' }}>
        <button
          className={`filter-btn ${selectedMembers.length > 0 ? 'active' : ''}`}
          onClick={() => { setShowMemberFilter(!showMemberFilter); setShowLabelFilter(false); setShowDueFilter(false); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="btn-text">Members {selectedMembers.length > 0 && `(${selectedMembers.length})`}</span>
        </button>

        {showMemberFilter && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMemberFilter(false)} />
            <div className="popover" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 100 }}>
              <div className="popover-header">
                <h4>Filter by Member</h4>
                <button className="popover-close" onClick={() => setShowMemberFilter(false)}>×</button>
              </div>
              <div className="popover-content">
                {members?.map(member => (
                  <div key={member.id} className="member-option" onClick={() => toggleMember(member.id)}>
                    <div className="member-option-avatar" style={{ background: member.avatar_color }}>
                      {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <span className="member-option-name">{member.name}</span>
                    {selectedMembers.includes(member.id) && (
                      <span className="member-option-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Due Date Filter */}
      <div style={{ position: 'relative' }}>
        <button
          className={`filter-btn ${selectedDue ? 'active' : ''}`}
          onClick={() => { setShowDueFilter(!showDueFilter); setShowLabelFilter(false); setShowMemberFilter(false); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="btn-text">Due Date {selectedDue && `(${selectedDue})`}</span>
        </button>

        {showDueFilter && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowDueFilter(false)} />
            <div className="popover" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 100 }}>
              <div className="popover-header">
                <h4>Filter by Due Date</h4>
                <button className="popover-close" onClick={() => setShowDueFilter(false)}>×</button>
              </div>
              <div className="popover-content">
                {[
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'today', label: 'Due Today' },
                  { value: 'week', label: 'Due This Week' },
                  { value: 'none', label: 'No Due Date' },
                  { value: 'complete', label: 'Completed' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className="member-option"
                    onClick={() => selectDue(opt.value)}
                    style={{ fontWeight: selectedDue === opt.value ? 600 : 400 }}
                  >
                    <span className="member-option-name">{opt.label}</span>
                    {selectedDue === opt.value && <span className="member-option-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button className="filter-clear" onClick={clearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}
