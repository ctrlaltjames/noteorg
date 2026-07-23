import { useState } from 'preact/hooks';
import { FileSystemProvider, useFileSystem } from './context/FileSystemContext';
import AppLayout from './components/Layout/AppLayout';
import FolderPicker from './components/Modals/FolderPicker';

function AppContent() {
  const { openDirectory } = useFileSystem();
  const [showFolderPicker, setShowFolderPicker] = useState(true);

  const handleOpenFolder = () => {
    setShowFolderPicker(true);
  };

  return (
    <>
      <AppLayout onOpenFolder={handleOpenFolder} />
      {showFolderPicker && <FolderPicker onClose={() => setShowFolderPicker(false)} />}
    </>
  );
}

export default function App() {
  return (
    <FileSystemProvider>
      <AppContent />
    </FileSystemProvider>
  );
}
