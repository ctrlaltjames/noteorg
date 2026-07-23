import { useAppState } from '../../context/AppStateContext';
import { getTagColor } from '../../utils/search';

export default function TagPanel() {
  const {
    allNoteTags,
    tags,
    activeTag,
    handleTagClick,
    handleOpenTagEditor,
  } = useAppState();

  const displayTags = allNoteTags.length > 0 ? allNoteTags : tags;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Tags
        </h3>
        <button
          onClick={() => handleOpenTagEditor('create')}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
          title="Add tag"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {displayTags.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
          No tags yet
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((item) => {
            const tagName = item.tag || item.name;
            const count = item.count || 0;
            const color = item.color || getTagColor(tagName);
            const isActive = activeTag === tagName;

            return (
              <button
                key={tagName}
                onClick={() => handleTagClick(tagName)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : ''
                } ${color}`}
              >
                <span>{tagName}</span>
                {count > 0 && (
                  <span className="text-xs opacity-75">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
