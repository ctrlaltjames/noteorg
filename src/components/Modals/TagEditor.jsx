import { useState, useCallback } from 'preact/hooks';
import { useAppState } from '../../context/AppStateContext';

export default function TagEditor() {
  const {
    showTagEditor,
    tagEditorMode,
    tagEditorValue,
    setTagEditorValue,
    handleSaveTagEditor,
    handleDeleteTagFromEditor,
    setShowTagEditor,
    tags,
  } = useAppState();

  const [localValue, setLocalValue] = useState(tagEditorValue);

  const handleClose = useCallback(() => {
    setShowTagEditor(false);
    setLocalValue('');
  }, [setShowTagEditor]);

  const handleSave = useCallback(() => {
    if (localValue.trim()) {
      handleSaveTagEditor();
    }
  }, [localValue, handleSaveTagEditor]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSave();
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleSave, handleClose]
  );

  if (!showTagEditor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tagEditorMode === 'create' ? 'Create Tag' : 'Edit Tag'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tag Name
            </label>
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. work, personal, idea"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Use lowercase letters, numbers, and hyphens
            </p>
          </div>

          {tagEditorMode === 'create' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Existing Tags
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          {tagEditorMode !== 'create' && (
            <button
              onClick={handleDeleteTagFromEditor}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!localValue.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tagEditorMode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
