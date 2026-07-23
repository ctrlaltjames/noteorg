import { useState } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';

export default function FolderPicker({ onClose }) {
  const { openDirectory } = useFileSystem();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePick = async () => {
    try {
      setError(null);
      setLoading(true);
      await openDirectory();
      onClose();
    } catch (e) {
      if (e.name === 'AbortError') {
        return;
      }
      setError(e.message || 'Failed to open folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay dark:bg-black/70" onClick={onClose}>
      <div className="modal-content w-full max-w-md bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📁</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select a Folder</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Choose a folder to store and organize your notes. Files will be saved directly to your machine.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>How it works:</strong> NoteOrg uses your browser's File System Access API to read and write files directly. Your data never leaves your computer.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePick}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opening...
                </>
              ) : (
                'Choose Folder'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
