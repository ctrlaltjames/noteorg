import { useAppState } from '../../context/AppStateContext';

export default function SearchResults() {
  const { searchResults, handleSelectResult } = useAppState();

  if (searchResults.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
      <div className="p-2">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </div>
        {searchResults.map((result) => (
          <button
            key={result.path}
            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-md"
            onClick={() => handleSelectResult(result)}
          >
            <span className="text-lg shrink-0">
              {result.type === 'note' ? '📝' : '📄'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {result.title || result.name.replace('.md', '')}
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
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {100 - result.score}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
