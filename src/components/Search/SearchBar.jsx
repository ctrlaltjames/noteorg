import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useAppState } from '../../context/AppStateContext';

const SEARCH_SHORTCUT = 'k';

export default function SearchBar({ onFocus }) {
  const {
    searchQuery,
    searchOpen,
    setSearchOpen,
    handleSearchChange,
    searchResults,
    handleSelectResult,
  } = useAppState();

  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const [highlightedIdx, setHighlightedIdx] = useState(0);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [searchResults]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        inputRef.current?.blur();
      }
      if (e.key === 'ArrowDown' && searchResults.length > 0) {
        e.preventDefault();
        setHighlightedIdx((prev) => Math.min(prev + 1, searchResults.length - 1));
      }
      if (e.key === 'ArrowUp' && searchResults.length > 0) {
        e.preventDefault();
        setHighlightedIdx((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && searchResults.length > 0) {
        e.preventDefault();
        handleSelectResult(searchResults[highlightedIdx]);
      }
    },
    [searchResults, highlightedIdx, handleSelectResult, setSearchOpen]
  );

  const handleInputChange = useCallback(
    (e) => {
      handleSearchChange(e.target.value);
    },
    [handleSearchChange]
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setFocused(false), 200);
  }, []);

  const handleClick = useCallback(() => {
    setSearchOpen((prev) => !prev);
    inputRef.current?.focus();
  }, [setSearchOpen]);

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
          searchOpen && focused
            ? 'border-blue-400 bg-white shadow-sm'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={handleClick}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search notes..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-40"
        />
        <kbd className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 ml-2">
          Ctrl+{SEARCH_SHORTCUT.toUpperCase()}
        </kbd>
      </div>

      {searchOpen && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
        >
          {searchResults.length === 0 && searchQuery.length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No results found
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Type at least 2 characters to search
            </div>
          ) : (
            <div>
              {searchResults.map((result, idx) => (
                <button
                  key={result.path}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                    idx === highlightedIdx
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                >
                  <span className="text-lg shrink-0">
                    {result.type === 'note' ? '📝' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.title || result.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.path}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-1 flex-wrap">
                    {(result.tags || []).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
