import { useState, useRef, useEffect } from 'preact/hooks';
import { useApp } from '@context/AppContext';
import { renderMarkdown, getPreview } from '@utils/markdown';
import { deleteImage } from '@utils/images';
import { supabase } from '@lib/supabase';

export default function ArtifactViewer({ artifact, isEditing, onEdit, onCancelEdit, onClose, onSave }) {
  const { updateArtifact, deleteArtifact, loadData } = useApp();
  const [editTitle, setEditTitle] = useState(artifact.title || '');
  const [editContent, setEditContent] = useState(artifact.content || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef(null);

  // Update local state when artifact changes
  useEffect(() => {
    setEditTitle(artifact.title || '');
    setEditContent(artifact.content || '');
  }, [artifact.id]);

  // Remove auto-resize - textarea now fills available height via flex

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateArtifact(artifact.id, {
        title: editTitle,
        content: editContent,
      });
      onSave();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (artifact.type === 'image' && artifact.metadata?.storagePath) {
        await deleteImage(artifact.metadata.storagePath);
      }
      await deleteArtifact(artifact.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape' && isEditing) {
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div class="h-full flex flex-col" onKeyDown={handleKeyDown}>
        {/* Edit header */}
        <div class="flex items-center justify-between p-3 border-b border-dark-border shrink-0">
          <div class="flex items-center gap-2">
            <button
              onClick={onCancelEdit}
              class="text-dark-secondary hover:text-dark-text transition-colors"
              title="Back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="text-sm text-dark-secondary capitalize">{artifact.type}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              onClick={handleDelete}
              class="text-danger-dark hover:bg-danger-dark/10 px-2 py-1 rounded text-sm transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
              class="bg-primary-dark hover:bg-primary-dark/80 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Edit form */}
        <div class="flex-1 p-4 overflow-hidden flex flex-col">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Artifact title..."
            class="w-full text-xl font-bold bg-transparent border-none outline-none mb-3 text-dark-text"
          />
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Start writing..."
            class="w-full flex-1 min-h-0 resize-none bg-transparent border-none outline-none text-sm text-dark-text font-mono"
            spellCheck
          />
        </div>
      </div>
    );
  }

  // View mode
  const isNote = artifact.type === 'note';
  const metadata = artifact.metadata || {};

  return (
    <div class="h-full flex flex-col">
      {/* View header */}
      <div class="flex items-center justify-between p-3 border-b border-dark-border shrink-0">
        <div class="flex items-center gap-2">
          <button
            onClick={onClose}
            class="text-dark-secondary hover:text-dark-text transition-colors"
            title="Back to list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class={`text-xs px-2 py-0.5 rounded capitalize ${isNote ? 'bg-accent-dark/20 text-accent-dark' : 'bg-primary-dark/20 text-primary-dark'}`}>
            {artifact.type}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick={handleDelete}
            class="text-danger-dark hover:bg-danger-dark/10 p-1.5 rounded transition-colors"
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            class="bg-accent-dark hover:bg-accent-dark/80 text-white px-3 py-1.5 rounded text-sm transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <h1 class="text-2xl font-bold text-dark-text mb-4">{artifact.title || 'Untitled'}</h1>

        {/* Tags */}
        {artifact.tagNames?.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mb-4">
            {artifact.tagNames.map((tag) => (
              <span key={tag} class="text-xs bg-dark-border/30 text-dark-secondary px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Note content */}
        {isNote ? (
          <div
            class="prose prose-sm max-w-none text-dark-text"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(artifact.content) }}
          />
        ) : (
          /* Image content */
          <div class="flex flex-col items-center">
            <img
              src={metadata.storagePath ? supabase.storage.from('images').getPublicUrl(metadata.storagePath).data.publicUrl : ''}
              alt={artifact.title}
              class="max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                e.target.src = '';
                e.target.alt = 'Image not found';
              }}
            />
            {metadata.width && metadata.height && (
              <p class="text-xs text-dark-secondary mt-2">
                {metadata.width} x {metadata.height}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div class="mt-6 pt-4 border-t border-dark-border text-xs text-dark-secondary">
          <div class="flex items-center gap-4">
            <span>Created: {new Date(artifact.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(artifact.updated_at).toLocaleString()}</span>
          </div>
          {isNote && artifact.content && (
            <span class="block mt-1">
              {artifact.content.split(/\s+/).filter(Boolean).length} words
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
