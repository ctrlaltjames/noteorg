import { useState, useCallback, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import FolderNode from './FolderNode';

export default function FolderTree({ selectedPath, onSelect, onRename, onContextMenu }) {
  const { listDirectory, refreshKey } = useFileSystem();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listDirectory('');
      setItems(result);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listDirectory]);

  useEffect(() => {
    loadRoot();
  }, [loadRoot, refreshKey]);

  const handleSelect = useCallback(
    (item) => {
      if (item.name.endsWith('.md')) {
        onSelect(item);
      }
    },
    [onSelect]
  );

  const handleContext = useCallback((item, e) => {
    e.preventDefault();
  }, []);

  if (loading) {
    return (
      <div className="p-2">
        <div className="text-sm text-gray-400 text-center py-4">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-2">
        <div className="text-sm text-gray-400 text-center py-4">
          No items found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <FolderNode
          key={item.path}
          item={item}
          depth={0}
          onSelect={handleSelect}
          onContext={handleContext}
          onRename={onRename}
          onContextMenu={onContextMenu}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
