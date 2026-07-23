import { useState } from 'preact/hooks';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import ArtifactViewer from '../Editor/ArtifactViewer';
import QuickAddModal from '../Modals/QuickAdd';

export default function AppLayout() {
  const { selectedArtifact, setSelectedArtifact, loadData } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleArtifactSelect = async (artifact) => {
    setSelectedArtifact(artifact);
    setIsEditing(false);
    await loadData();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleClose = () => {
    setSelectedArtifact(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    await loadData();
    setIsEditing(false);
  };

  return (
    <div class="flex h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar onOpenQuickAdd={() => setShowQuickAdd(true)} onArtifactSelect={handleArtifactSelect} />

      {/* Main area */}
      <div class="flex-1 overflow-hidden">
        {selectedArtifact ? (
          <ArtifactViewer
            artifact={selectedArtifact}
            isEditing={isEditing}
            onEdit={handleEdit}
            onClose={handleClose}
            onSave={handleSave}
          />
        ) : (
          <div class="h-full flex items-center justify-center text-dark-secondary">
            <div class="text-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                class="mx-auto mb-4 text-dark-border"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p class="text-sm font-medium mb-1">Select an artifact</p>
              <p class="text-xs text-dark-secondary">Choose a note or image from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* QuickAdd modal */}
      {showQuickAdd && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQuickAdd(false)}>
          <QuickAddModal onClose={() => setShowQuickAdd(false)} />
        </div>
      )}
    </div>
  );
}
