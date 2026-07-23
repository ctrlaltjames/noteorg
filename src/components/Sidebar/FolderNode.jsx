import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import { useAppState } from '../../context/AppStateContext';

export default function FolderNode({ item, depth, onSelect, onContext, onRename, onContextMenu, selectedPath }) {
  const { listDirectory } = useFileSystem();
  const { handleCloseContextMenu } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const closeRef = useRef(false);

  const isSelected = selectedPath === item.path;
  const isExpanded = expanded || (item.kind === 'directory' && depth < 2);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (item.kind === 'directory') {
      setExpanded(!isExpanded);
    } else {
      onSelect(item);
    }
  }, [item, isExpanded, onSelect]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.kind === 'file') {
      closeRef.current = true;
      onContextMenu?.(e.clientX, e.clientY, item.path, item.name);
    } else if (onContext) {
      onContext(item, e);
    }
  }, [item, onContext, onContextMenu]);

  const handleRename = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRename && item.kind === 'file') {
      onRename(item.path, item.name);
      closeRef.current = false;
      handleCloseContextMenu();
    }
  }, [onRename, item, handleCloseContextMenu]);

  const closeMenu = useCallback(() => {
    closeRef.current = false;
    handleCloseContextMenu();
  }, [handleCloseContextMenu]);

  const handleExpand = useCallback(async () => {
    if (expanded || loading || children.length > 0) return;
    setLoading(true);
    setExpanded(true);
    try {
      const result = await listDirectory(item.path);
      setChildren(result);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [expanded, loading, children.length, item.path, listDirectory]);

  useEffect(() => {
    if (isExpanded && item.kind === 'directory' && children.length === 0 && !loading) {
      handleExpand();
    }
  }, [isExpanded, item.kind, item.path, children.length, loading, handleExpand]);

  // Single shared handler that checks ref synchronously
  const handleOutsideClick = useCallback((e) => {
    if (!closeRef.current) return;
    closeMenu();
  }, [closeMenu]);

  useEffect(() => {
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const icon = item.kind === 'directory'
    ? (isExpanded ? '📂' : '📁')
    : item.name.endsWith('.md')
      ? '📝'
      : /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name)
        ? '🖼️'
        : '📄';

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="w-5 text-center shrink-0">{icon}</span>
        <span className="truncate">{item.name}</span>
      </div>
      {item.kind === 'directory' && isExpanded && (
        <div>
          {loading ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 px-4 py-1">Loading...</div>
          ) : children.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 px-4 py-1">Empty</div>
          ) : (
            children.map((child) => (
              <FolderNode
                key={child.path}
                item={child}
                depth={depth + 1}
                onSelect={onSelect}
                onContext={onContext}
                onRename={onRename}
                onContextMenu={onContextMenu}
                selectedPath={selectedPath}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
