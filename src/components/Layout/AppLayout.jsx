import { useState, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import { useAppState } from '../../context/AppStateContext';
import Sidebar from './Sidebar';
import MainArea from './MainArea';
import FolderPicker from '../Modals/FolderPicker';
import TagEditor from '../Modals/TagEditor';
import SearchBar from '../Search/SearchBar';

export default function AppLayout() {
  const { directoryHandle, openDirectory } = useFileSystem();
  const { selectedNote, handleSelectNote, sidebarTab, setSidebarTab, setSearchOpen } = useAppState();
  const [showFolderPicker, setShowFolderPicker] = useState(!directoryHandle);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setSearchOpen]);

  const handleSelectNoteItem = (item) => {
    handleSelectNote(item);
  };

  const handleOpenFolder = () => {
    setShowFolderPicker(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">NoteOrg</h1>
        {directoryHandle && (
          <span className="text-sm text-gray-500 truncate max-w-md">
            {'\u{1F4C1}'} {directoryHandle.name}
          </span>
        )}
        <div className="flex-1" />
        <SearchBar />
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
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          selectedPath={selectedNote?.path}
          onSelect={handleSelectNoteItem}
        />

        {/* Main panel */}
        <MainArea />
      </div>

      {/* Folder picker modal */}
      {showFolderPicker && (
        <FolderPicker onClose={() => setShowFolderPicker(false)} />
      )}

      {/* Tag editor modal */}
      <TagEditor />
    </div>
  );
}
