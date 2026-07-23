import { useFileSystem } from '../../context/FileSystemContext';
import FolderTree from '../Sidebar/FolderTree';
import TagPanel from '../Sidebar/TagPanel';

export default function Sidebar({ activeTab, onTabChange, selectedPath, onSelect, onRename, onContextMenu }) {
  const { directoryHandle, lastFolderName, openDirectory } = useFileSystem();

  const handlePickFolder = () => {
    openDirectory().catch(() => {});
  };

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center px-2 gap-1 shrink-0">
        <button
          onClick={() => onTabChange('explorer')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'explorer'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Explorer
        </button>
        <button
          onClick={() => onTabChange('tags')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeTab === 'tags'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Tags
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {directoryHandle ? (
          activeTab === 'explorer' ? (
            <FolderTree
              selectedPath={selectedPath}
              onSelect={onSelect}
              onRename={onRename}
              onContextMenu={onContextMenu}
            />
          ) : (
            <TagPanel />
          )
        ) : (
          <div className="p-4 space-y-3">
            {lastFolderName && (
              <button
                onClick={handlePickFolder}
                className="w-full text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Last session: <span className="font-medium text-gray-700">{lastFolderName}</span> →
              </button>
            )}
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
