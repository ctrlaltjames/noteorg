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
  const [cursorLine, setCursorLine] = useState(1);
  const [showSplit, setShowSplit] = useState(false);
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  // Update local state when artifact changes
  useEffect(() => {
    setEditTitle(artifact.title || '');
    setEditContent(artifact.content || '');
  }, [artifact.id]);

  // Enable split view by default when entering edit mode
  useEffect(() => {
    if (isEditing && artifact.type === 'note') {
      setShowSplit(true);
    }
  }, [isEditing]);

  const getLineNumbers = (text) => {
    if (!text) return [1];
    return Array.from({ length: text.split('\n').length }, (_, i) => i + 1);
  };

  const getCurrentLine = (text, cursorPos) => {
    if (!text) return 1;
    const beforeCursor = text.substring(0, cursorPos);
    const lines = beforeCursor.split('\n');
    return lines.length;
  };

  const handleCursorMove = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setCursorLine(getCurrentLine(textarea.value, textarea.selectionStart));
  };

  const handleScroll = () => {
    const textarea = textareaRef.current;
    const gutter = gutterRef.current;
    if (textarea && gutter) {
      gutter.scrollTop = textarea.scrollTop;
    }
  };

  const renderLineNumbers = () => {
    return getLineNumbers(editContent).map((line, i) => {
      const isCurrent = i + 1 === cursorLine;
      return `<div class="flex items-center justify-end h-[1.625rem] px-2 ${isCurrent ? 'text-dark-text/80 font-semibold bg-dark-border/20' : ''}">${line}</div>`;
    }).join('');
  };

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

  if (isEditing && artifact.type === 'note') {
    return (
      <div class="h-full flex flex-col" onKeyDown={handleKeyDown}>
        {/* Edit header */}
        <div class="flex items-center gap-2 p-3 border-b border-dark-border shrink-0">
          <button
            onClick={onCancelEdit}
            class="text-dark-secondary hover:text-dark-text transition-colors p-1.5 rounded"
            title="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="text-sm text-dark-secondary capitalize">{artifact.type}</span>
          <div class="w-px h-5 bg-dark-border" />
          <button
            onClick={() => setShowSplit(!showSplit)}
            class={`p-2 rounded transition-colors ${showSplit ? 'text-dark-text' : 'text-dark-secondary'} hover:bg-white/5 hover:text-yellow-300`}
            title="Toggle split view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editTitle.trim()}
            class="text-dark-secondary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded transition-colors hover:bg-white/5"
            title="Save (Ctrl+S)"
          >
            {saving ? (
              <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            )}
          </button>
          <button
            onClick={handleDelete}
            class="text-dark-secondary hover:text-danger-dark p-2 rounded transition-colors hover:bg-white/5"
            title="Delete"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>

        <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Title bar */}
          <div class="px-4 pt-3 pb-1 shrink-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Artifact title..."
              class="w-full text-xl font-bold bg-transparent border-none outline-none text-dark-text"
            />
          </div>

          {/* Editor + Preview area */}
          <div class="flex-1 min-h-0 px-4 pb-4 overflow-hidden">
            {showSplit ? (
              <div class="h-full flex gap-3">
                {/* Editor pane */}
                <div class="flex-1 min-w-0 flex flex-col">
                  <div class="text-xs text-dark-secondary/60 mb-1.5 font-medium uppercase tracking-wider">Edit</div>
                  <div class="flex-1 min-h-0 relative border border-dark-border/30 rounded">
                    <div
                      ref={gutterRef}
                      class="absolute left-0 top-0 bottom-0 w-12 bg-dark-card text-dark-secondary/40 text-sm font-mono text-right select-none overflow-hidden py-3 border-r border-dark-border/20 z-10"
                    />
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onInput={(e) => setEditContent(e.target.value)}
                      onKeyUp={handleCursorMove}
                      onSelect={handleCursorMove}
                      onScroll={handleScroll}
                      placeholder="Start writing..."
                      class="absolute left-12 right-0 top-0 bottom-0 resize-none bg-transparent border-none outline-none text-sm text-dark-text font-mono p-3"
                      spellCheck
                      style={{ lineHeight: '1.625rem' }}
                    />
                  </div>
                </div>
                {/* Preview pane */}
                <div class="flex-1 min-w-0 flex flex-col">
                  <div class="text-xs text-dark-secondary/60 mb-1.5 font-medium uppercase tracking-wider">Preview</div>
                  <div class="flex-1 min-h-0 border border-dark-border/30 rounded overflow-y-auto p-4 bg-dark-card">
                    <div
                      class="prose prose-sm max-w-none text-dark-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                    {!editContent && (
                      <p class="text-dark-secondary/40 text-sm italic">Nothing to preview yet...</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div class="h-full flex flex-col">
                <div class="flex-1 min-h-0 relative border border-dark-border/30 rounded">
                  <div
                    ref={gutterRef}
                    class="absolute left-0 top-0 bottom-0 w-12 bg-dark-card text-dark-secondary/40 text-sm font-mono text-right select-none overflow-hidden py-3 border-r border-dark-border/20 z-10"
                  />
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onInput={(e) => setEditContent(e.target.value)}
                    onKeyUp={handleCursorMove}
                    onSelect={handleCursorMove}
                    onScroll={handleScroll}
                    placeholder="Start writing..."
                    class="absolute left-12 right-0 top-0 bottom-0 resize-none bg-transparent border-none outline-none text-sm text-dark-text font-mono p-3"
                    spellCheck
                    style={{ lineHeight: '1.625rem' }}
                  />
                </div>
              </div>
            )}
          </div>
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
        <div class="flex items-center gap-1">
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
