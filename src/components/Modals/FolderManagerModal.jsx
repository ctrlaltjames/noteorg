import { useState } from 'preact/hooks';
import { useApp } from '@context/AppContext';

export default function FolderManagerModal({ onClose }) {
  const { folders, createFolder, deleteFolder, renameFolder, loadData } = useApp();
  const [newFolderName, setNewFolderName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim(), newParentId || null);
      setNewFolderName('');
      setNewParentId('');
      setShowNewFolder(false);
      await loadData();
    }
  };

  const handleStartRename = (folder) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  };

  const handleSaveRename = async (folderId) => {
    if (renameValue.trim()) {
      await renameFolder(folderId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
    await loadData();
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = async (folderId) => {
    await deleteFolder(folderId);
    setDeleteConfirmId(null);
  };

  const getFolderChildren = (parentId) => {
    return folders.filter((f) => f.parent_id === parentId);
  };

  const renderFolderTree = (parentId = null, depth = 0) => {
    const children = getFolderChildren(parentId);
    return children.map((folder) => (
      <div key={folder.id}>
        <div
          class="flex items-center gap-2 p-2 rounded theme-bg-border/20"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="theme-text-secondary shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>

          {renamingId === folder.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              class="flex-1 text-sm bg-transparent theme-text border theme-border rounded px-2 py-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(folder.id);
                if (e.key === 'Escape') handleCancelRename();
              }}
              autoFocus
            />
          ) : (
            <span class="flex-1 text-sm theme-text truncate">{folder.name}</span>
          )}

          {renamingId === folder.id ? (
            <div class="flex gap-1">
              <button
                onClick={() => handleSaveRename(folder.id)}
                class="p-1 text-green-400 hover:text-green-300"
                title="Save"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={handleCancelRename}
                class="p-1 text-red-400 hover:text-red-300"
                title="Cancel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <div class="flex gap-0.5">
              <button
                onClick={() => handleStartRename(folder)}
                class="p-1 theme-text-secondary hover:theme-text transition-colors"
                title="Rename"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              {deleteConfirmId === folder.id ? (
                <div class="flex gap-0.5">
                  <button
                    onClick={() => handleDelete(folder.id)}
                    class="p-1 text-red-400 hover:text-red-300"
                    title="Confirm delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    class="p-1 theme-text-secondary hover:theme-text"
                    title="Cancel"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(folder.id)}
                  class="p-1 theme-text-secondary hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {renderFolderTree(folder.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div class="theme-bg-panel border theme-border rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b theme-border">
        <h2 class="text-lg font-semibold theme-text">Manage Folders</h2>
        <button
          onClick={onClose}
          class="theme-text-secondary hover:theme-text transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="p-4 max-h-[60vh] overflow-y-auto">
        {/* Folder tree */}
        <div class="space-y-0.5">
          {folders.length === 0 ? (
            <p class="text-sm theme-text-secondary text-center py-4">No folders yet</p>
          ) : (
            renderFolderTree()
          )}
        </div>

        {/* Add new folder */}
        <div class="mt-4">
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            class="text-sm text-[var(--text-accent)] hover:underline"
          >
            {showNewFolder ? 'Cancel' : '+ New folder'}
          </button>

          {showNewFolder && (
            <div class="mt-2 space-y-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                class="w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                class="w-full"
              >
                <option value="">No parent (top-level)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                class="bg-[var(--btn-primary)] text-white px-3 py-1.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
