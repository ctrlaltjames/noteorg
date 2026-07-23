import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { useAppState } from '../../context/AppStateContext';

export default function RenameModal() {
  const { renameModal, handleCloseRename, handleSaveRename } = useAppState();
  const [localName, setLocalName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (renameModal.show) {
      const ext = renameModal.currentName.endsWith('.md')
        ? '.md'
        : renameModal.currentName.match(/\.[^.]+$/)?.[0] || '';
      setLocalName(renameModal.currentName.replace(ext, ''));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [renameModal]);

  const handleClose = useCallback(() => {
    handleCloseRename();
    setLocalName('');
  }, [handleCloseRename]);

  const handleSave = useCallback(() => {
    const ext = renameModal.currentName.match(/\.[^.]+$/)?.[0] || '';
    const newName = localName.trim() + ext;
    if (newName && newName !== renameModal.currentName) {
      handleSaveRename(newName);
    }
  }, [localName, renameModal, handleSaveRename]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') handleClose();
    },
    [handleSave, handleClose]
  );

  if (!renameModal.show) return null;

  const fileName = renameModal.currentName.split('/').pop();
  const fileExt = fileName.match(/\.[^.]+$/)?.[0] || '';
  const filePath = renameModal.currentName.endsWith('.md') ? '📝 Markdown Note' : '📄 File';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{filePath}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="File name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Extension <code className="bg-gray-100 px-1 rounded">{fileExt || 'auto'}</code> will be preserved
          </p>
        </div>

        <div className="flex gap-3 px-5 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!localName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
