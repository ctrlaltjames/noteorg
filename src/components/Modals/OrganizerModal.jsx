import { useState } from 'preact/hooks';
import { useApp } from '@context/AppContext';

export default function OrganizerModal({ artifact, onClose }) {
  const { tags, folders, updateArtifactTags, moveArtifact, createTag } = useApp();
  const [selectedTags, setSelectedTags] = useState(artifact.tagNames || []);
  const [selectedFolder, setSelectedFolder] = useState(artifact.folder_id || '');
  const [tagInput, setTagInput] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = (tagName) => {
    if (tagName && !selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagName) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      const tag = await createTag(newTagName.trim());
      setSelectedTags([...selectedTags, tag.name]);
      setNewTagName('');
      setShowNewTag(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagIds = [];
      for (const tagName of selectedTags) {
        const existing = tags.find((t) => t.name === tagName);
        if (existing) {
          tagIds.push(existing.id);
        }
      }

      await updateArtifactTags(artifact.id, tagIds);
      if (selectedFolder !== (artifact.folder_id || '')) {
        await moveArtifact(artifact.id, selectedFolder || null);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="theme-bg-panel border theme-border rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b theme-border">
        <h2 class="text-lg font-semibold theme-text">Organize</h2>
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

      <div class="p-4 space-y-4">
        {/* Tags section */}
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium theme-text">Tags</label>
            <button
              onClick={() => setShowNewTag(!showNewTag)}
              class="text-xs text-[var(--text-accent)] hover:underline"
            >
              {showNewTag ? 'Cancel' : '+ New tag'}
            </button>
          </div>

          {showNewTag ? (
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                class="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <button
                onClick={handleCreateTag}
                class="bg-[var(--btn-primary)] text-white px-3 rounded text-sm"
              >
                Add
              </button>
            </div>
          ) : (
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add existing tag..."
                class="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (handleAddTag(tagInput), e.preventDefault())}
              />
            </div>
          )}

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div class="flex flex-wrap gap-1">
              {selectedTags.map((tagName) => {
                const tagData = tags.find((t) => t.name === tagName);
                const color = tagData?.color || '#58a6ff';
                return (
                  <span
                    key={tagName}
                    class="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {tagName}
                    <button onClick={() => handleRemoveTag(tagName)} class="hover:text-[var(--btn-danger)]">&times;</button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Existing tag suggestions */}
          {tags.length > 0 && !showNewTag && selectedTags.length < tags.length && (
            <div class="flex flex-wrap gap-1 mt-1">
              {tags
                .filter((t) => !selectedTags.includes(t.name))
                .slice(0, 5)
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.name)}
                    class="text-xs px-2 py-1 rounded hover:opacity-80"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Folder section */}
        <div>
          <label class="block text-sm font-medium theme-text mb-1.5">Folder</label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            class="w-full"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          class="w-full bg-[var(--btn-primary)] hover:bg-[var(--btn-primary)]/80 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
