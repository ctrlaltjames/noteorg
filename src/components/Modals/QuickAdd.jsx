import { useState } from 'preact/hooks';
import { useApp } from '@context/AppContext';
import { uploadImage } from '@utils/images';
import { useAuth } from '@context/AuthContext';

export default function QuickAddModal({ onClose }) {
  const { createArtifact, createTag, createFolder, tags, folders, loadData } = useApp();
  const { user } = useAuth();
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

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

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setSelectedFolder('');
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');

    try {
      if (type === 'note') {
        // Find existing tag IDs
        const tagIds = [];
        for (const tagName of selectedTags) {
          const existing = tags.find((t) => t.name === tagName);
          if (existing) {
            tagIds.push(existing.id);
          }
        }

        await createArtifact({
          type: 'note',
          title: title.trim(),
          content: content.trim(),
          metadata: { wordCount: content.split(/\s+/).filter(Boolean).length },
          tagIds,
          folder_id: selectedFolder || null,
        });
      } else if (type === 'image' && imageFile) {
        const imageData = await uploadImage(imageFile, user.id);
        await createArtifact({
          type: 'image',
          title: title.trim() || imageFile.name,
          content: '',
          metadata: imageData,
          tagIds: [],
          folder_id: selectedFolder || null,
        });
      }

      await loadData();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create artifact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="bg-dark-panel border border-dark-border rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-dark-border">
        <h2 class="text-lg font-semibold text-dark-text">Add New Artifact</h2>
        <button
          onClick={onClose}
          class="text-dark-secondary hover:text-dark-text transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Type selector */}
      <div class="p-4 space-y-4">
        <div class="flex gap-2">
          <button
            onClick={() => setType('note')}
            class={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              type === 'note'
                ? 'bg-accent-dark/20 text-accent-dark border border-accent-dark/30'
                : 'bg-dark-border/30 text-dark-secondary hover:bg-dark-border/50'
            }`}
          >
            <span class="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Note
            </span>
          </button>
          <button
            onClick={() => setType('image')}
            class={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              type === 'image'
                ? 'bg-accent-dark/20 text-accent-dark border border-accent-dark/30'
                : 'bg-dark-border/30 text-dark-secondary hover:bg-dark-border/50'
            }`}
          >
            <span class="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Image
            </span>
          </button>
        </div>

        {/* Title */}
        <div>
          <label class="block text-sm font-medium text-dark-text mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'note' ? 'Enter title...' : 'Image name...'}
            class="w-full"
          />
        </div>

        {/* Note content */}
        {type === 'note' && (
          <div>
            <label class="block text-sm font-medium text-dark-text mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note in markdown..."
              rows={6}
              class="w-full font-mono text-sm"
            />
          </div>
        )}

        {/* Image upload */}
        {type === 'image' && (
          <div>
            <label class="block text-sm font-medium text-dark-text mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              class="w-full text-sm text-dark-secondary"
            />
            {imageFile && (
              <p class="text-xs text-dark-secondary mt-1">{imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
        )}

        {/* Folder selector */}
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-sm font-medium text-dark-text">Folder</label>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              class="text-xs text-accent-dark hover:underline"
            >
              {showNewFolder ? 'Cancel' : '+ New folder'}
            </button>
          </div>
          {showNewFolder ? (
            <div class="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                class="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <button
                onClick={handleCreateFolder}
                class="bg-primary-dark text-white px-3 rounded text-sm"
              >
                Add
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* Tag selector */}
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-sm font-medium text-dark-text">Tags</label>
            <button
              onClick={() => setShowNewTag(!showNewTag)}
              class="text-xs text-accent-dark hover:underline"
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
                class="bg-primary-dark text-white px-3 rounded text-sm"
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
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  class="flex items-center gap-1 text-xs bg-accent-dark/20 text-accent-dark px-2 py-1 rounded"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} class="hover:text-danger-dark">&times;</button>
                </span>
              ))}
            </div>
          )}

          {/* Existing tag suggestions */}
          {tags.length > 0 && !showNewTag && (
            <div class="flex flex-wrap gap-1 mt-1">
              {tags
                .filter((t) => !selectedTags.includes(t.name))
                .slice(0, 5)
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.name)}
                    class="text-xs bg-dark-border/30 text-dark-secondary px-2 py-1 rounded hover:bg-dark-border/50"
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div class="bg-danger-dark/10 border border-danger-dark/30 text-danger-dark rounded p-2 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim() || (type === 'image' && !imageFile)}
          class="w-full bg-primary-dark hover:bg-primary-dark/80 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Creating...' : `Create ${type === 'note' ? 'Note' : 'Image'}`}
        </button>
      </div>
    </div>
  );
}
