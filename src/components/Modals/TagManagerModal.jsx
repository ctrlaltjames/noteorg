import { useState } from 'preact/hooks';
import { useApp } from '@context/AppContext';

const TAG_COLORS = [
  '#58a6ff', '#3fb950', '#f0883e', '#a371f7',
  '#f7784b', '#db61a2', '#56d4dd', '#e3b22e',
  '#79c0ff', '#7ee787', '#d2a8ff', '#ff7b72',
];

export default function TagManagerModal({ onClose }) {
  const { tags, createTag, deleteTag, renameTag, updateTagColor, artifacts, loadData } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [customColor, setCustomColor] = useState('');

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      await createTag(newTagName.trim());
      setNewTagName('');
      await loadData();
    }
  };

  const handleStartRename = (tag) => {
    setRenamingId(tag.id);
    setRenameValue(tag.name);
  };

  const handleSaveRename = async (tagId) => {
    if (renameValue.trim()) {
      await renameTag(tagId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
    await loadData();
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = async (tagId) => {
    await deleteTag(tagId);
    setDeleteConfirmId(null);
    await loadData();
  };

  const handleColorSelect = async (tagId, color) => {
    await updateTagColor(tagId, color);
    setColorPickerId(null);
    setCustomColor('');
  };

  const handleCustomColor = async (tagId) => {
    if (customColor.trim()) {
      await updateTagColor(tagId, customColor.trim());
      setColorPickerId(null);
      setCustomColor('');
    }
  };

  const getTagArtifactCount = (tagName) => {
    return artifacts.filter((a) => {
      if (Array.isArray(a.tagNames)) {
        return a.tagNames.some((t) => typeof t === 'string' ? t === tagName : t.name === tagName);
      }
      return false;
    }).length;
  };

  return (
    <div class="theme-bg-panel border theme-border rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b theme-border">
        <h2 class="text-lg font-semibold theme-text">Manage Tags</h2>
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
        {/* Tag list */}
        <div class="space-y-1">
          {tags.length === 0 ? (
            <p class="text-sm theme-text-secondary text-center py-4">No tags yet</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                class="flex items-center gap-2 p-2 rounded theme-bg-border/20"
              >
                {/* Color swatch */}
                <div class="relative shrink-0">
                  <button
                    onClick={() => setColorPickerId(colorPickerId === tag.id ? null : tag.id)}
                    class="w-5 h-5 rounded-full border-2 border-white/20 shadow-sm"
                    style={{ backgroundColor: tag.color }}
                    title="Change color"
                  />
                  {colorPickerId === tag.id && (
                    <div class="absolute left-0 top-full mt-1 z-20 p-2 rounded-lg border theme-border theme-bg-panel shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <div class="grid grid-cols-4 gap-1 mb-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(tag.id, color)}
                            class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: color,
                              borderColor: tag.color === color ? 'var(--text-primary)' : 'transparent',
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div class="flex gap-1">
                        <input
                          type="color"
                          value={customColor || tag.color}
                          onChange={(e) => setCustomColor(e.target.value)}
                          class="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <button
                          onClick={() => handleCustomColor(tag.id)}
                          class="text-xs bg-[var(--btn-primary)] text-white px-2 py-1 rounded"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {renamingId === tag.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    class="flex-1 text-sm bg-transparent theme-text border theme-border rounded px-2 py-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(tag.id);
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                  />
                ) : (
                  <span class="flex-1 text-sm theme-text">
                    {tag.name}
                    <span class="text-xs theme-text-secondary ml-1">
                      ({getTagArtifactCount(tag.name)})
                    </span>
                  </span>
                )}

                {renamingId === tag.id ? (
                  <div class="flex gap-1">
                    <button
                      onClick={() => handleSaveRename(tag.id)}
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
                      onClick={() => handleStartRename(tag)}
                      class="p-1 theme-text-secondary hover:theme-text transition-colors"
                      title="Rename"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {deleteConfirmId === tag.id ? (
                      <div class="flex gap-0.5">
                        <button
                          onClick={() => handleDelete(tag.id)}
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
                        onClick={() => setDeleteConfirmId(tag.id)}
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
            ))
          )}
        </div>

        {/* Add new tag */}
        <div class="mt-4 flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            class="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
          />
          <button
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
            class="bg-[var(--btn-primary)] text-white px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
