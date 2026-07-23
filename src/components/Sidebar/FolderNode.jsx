import { useState, useCallback, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';

export default function FolderNode({ item, depth, onSelect, onContext, onRename, selectedPath }) {
  const { listDirectory } = useFileSystem();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState(null);

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
      setMenuPos({ x: e.clientX, y: e.clientY });
    } else if (onContext) {
      onContext(item, e);
    }
  }, [item, onContext]);

  const handleRename = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRename && item.kind === 'file') {
      onRename(item.path, item.name);
      setMenuPos(null);
    }
  }, [onRename, item]);

  const closeMenu = useCallback(() => {
    setMenuPos(null);
  }, []);

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

  useEffect(() => {
    if (!menuPos) return;
    const handler = () => setMenuPos(null);
    document.addEventListener('pointerdown', handler);
    document.addEventListener('contextmenu', handler);
    return () => {
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [menuPos]);

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
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-gray-100 text-gray-700'
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
            <div className="text-xs text-gray-400 px-4 py-1">Loading...</div>
          ) : children.length === 0 ? (
            <div className="text-xs text-gray-400 px-4 py-1">Empty</div>
          ) : (
            children.map((child) => (
              <FolderNode
                key={child.path}
                item={child}
                depth={depth + 1}
                onSelect={onSelect}
                onContext={onContext}
                onRename={onRename}
                selectedPath={selectedPath}
              />
            ))
          )}
        </div>
      )}
      {menuPos && item.kind === 'file' && (
        <>
          <div className="fixed inset-0 z-[90]" />
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[95] min-w-[180px]"
            style={{ left: menuPos.x, top: menuPos.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onPointerDown={handleRename}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-3.586l-7.586 7.586a1.414 1.414 0 000 2l2.828 2.828a1.414 1.414 0 002 0l7.586-7.586a1.414 1.414 0 000-2l-2.828-2.828a1.414 1.414 0 00-2 0z" />
              </svg>
              Rename
            </button>
          </div>
        </>
      )}
    </div>
  );
}
