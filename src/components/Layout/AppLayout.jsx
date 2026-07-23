import { useState } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import Sidebar from './Sidebar';
import MainArea from './MainArea';
import FolderPicker from '../Modals/FolderPicker';

export default function AppLayout() {
  const { directoryHandle, openDirectory } = useFileSystem();
  const [showFolderPicker, setShowFolderPicker] = useState(!directoryHandle);
  const [selectedPath, setSelectedPath] = useState(null);

  const handleSelectNote = (item) => {
    setSelectedPath(item.path);
  };

  const handleOpenFolder = () => {
    setShowFolderPicker(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">NoteOrg</h1>
        {directoryHandle && (
          <span className="ml-4 text-sm text-gray-500 truncate max-w-md">
            📁 {directoryHandle.name}
          </span>
        )}
        <div className="flex-1" />
        {!directoryHandle && (
          <button
            onClick={() => setShowFolderPicker(true)}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose Folder
          </button>
        )}
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedPath={selectedPath}
          onSelect={handleSelectNote}
        />

        {/* Main panel */}
        <MainArea />
      </div>

      {/* Folder picker modal */}
      {showFolderPicker && (
        <FolderPicker onClose={() => setShowFolderPicker(false)} />
      )}
    </div>
  );
}
