import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ boardId, onSearch, searchResults, onSelectCard, onClearResults }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setShowResults(true);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(val);
    }, 300);
  }

  function handleSelect(cardId) {
    onSelectCard(cardId);
    setShowResults(false);
    setQuery('');
    onClearResults();
  }

  return (
    <div className="search-container" ref={containerRef}>
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setShowResults(true)}
        placeholder="Search cards..."
        id="search-input"
      />
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      {showResults && searchResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(card => (
            <div key={card.id} className="search-result-item" onClick={() => handleSelect(card.id)}>
              <div>
                <div className="search-result-title">{card.title}</div>
                <div className="search-result-list">in {card.list_title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults && searchResults.length === 0 && query.trim() && (
        <div className="search-results">
          <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No cards found
          </div>
        </div>
      )}
    </div>
  );
}
