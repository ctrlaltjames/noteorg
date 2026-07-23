import { useEffect } from 'preact/hooks';
import { useAppState } from '../context/AppStateContext';

export default function ContextMenu() {
  const { contextMenu, handleCloseContextMenu, handleOpenRename } = useAppState();
  const { show, x, y, path } = contextMenu;

  useEffect(() => {
    if (!show) return;
    const handler = () => { handleCloseContextMenu(); };
    document.addEventListener('pointerdown', handler);
    document.addEventListener('scroll', handler, true);
    return () => {
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('scroll', handler, true);
    };
  }, [show, handleCloseContextMenu]);

  if (!show) return null;

  const handleRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = path.split('/').pop();
    handleOpenRename(path, name);
    handleCloseContextMenu();
  };

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-[9999] min-w-[180px]"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onPointerDown={handleRename}
        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-3.586l-7.586 7.586a1.414 1.414 0 000 2l2.828 2.828a1.414 1.414 0 002 0l7.586-7.586a1.414 1.414 0 000-2l-2.828-2.828a1.414 1.414 0 00-2 0z" />
        </svg>
        Rename
      </button>
    </div>
  );
}
