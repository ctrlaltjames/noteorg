import { useState, useCallback } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import FolderTree from '../Sidebar/FolderTree';

export default function Sidebar({ selectedPath, onSelect }) {
  const { directoryHandle, openDirectory } = useFileSystem();
  const [activeTab, setActiveTab] = useState('explorer');

  const handlePickFolder = useCallback(() => {
    openDirectory().catch(() => {});
  }, [openDirectory]);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="h-10 border-b border-gray-200 flex items-center px-2 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'explorer'
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Explorer
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {directoryHandle ? (
          <FolderTree
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ) : (
          <div className="p-4">
            <button
              onClick={handlePickFolder}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Choose a Folder
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
