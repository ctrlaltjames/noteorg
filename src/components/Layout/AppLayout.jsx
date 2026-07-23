import { useState, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import { useAppState } from '../../context/AppStateContext';
import Sidebar from './Sidebar';
import MainArea from './MainArea';
import Toolbar from './Toolbar';
import FolderPicker from '../Modals/FolderPicker';
import TagEditor from '../Modals/TagEditor';
import SettingsModal from '../Modals/SettingsModal';
import ImageViewer from '../Modals/ImageViewer';

export default function AppLayout() {
  const { directoryHandle, lastFolderName, openDirectory } = useFileSystem();
  const {
    selectedNote,
    handleSelectNote,
    sidebarTab,
    setSidebarTab,
    setSearchOpen,
    showSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAppState();
  const [showFolderPicker, setShowFolderPicker] = useState(false);

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
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - responsive: overlay on mobile, inline on desktop */}
        <div
          className={`${
            sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
          } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-30 lg:z-0 w-64 shrink-0 transform transition-transform duration-200 ease-in-out`}
        >
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            selectedPath={selectedNote?.path}
            onSelect={handleSelectNoteItem}
          />
        </div>

        {/* Sidebar overlay for mobile */}
        {sidebarCollapsed || (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-20"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main panel */}
        <MainArea className="flex-1 lg:ml-0" />
      </div>

      {/* Folder picker modal */}
      {showFolderPicker && (
        <FolderPicker onClose={() => setShowFolderPicker(false)} />
      )}

      {/* Tag editor modal */}
      <TagEditor />

      {/* Settings modal */}
      {showSettings && <SettingsModal />}

      {/* Image viewer */}
      <ImageViewer />
    </div>
  );
}
