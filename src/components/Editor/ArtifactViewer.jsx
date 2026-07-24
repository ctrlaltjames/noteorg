import { useState, useRef, useEffect, useLayoutEffect } from 'preact/hooks';
import { useApp } from '@context/AppContext';
import { renderMarkdown, getPreview } from '@utils/markdown';
import { deleteImage } from '@utils/images';
import { supabase } from '@lib/supabase';
import InlineMenu from './InlineMenu';

const LINE_HEIGHT = 22.75; // 1.625rem * 14px root font-size
const GUTTER_WIDTH = 48;
const FORMAT_GUTTER_WIDTH = 32;
const TOTAL_GUTTER_WIDTH = GUTTER_WIDTH + FORMAT_GUTTER_WIDTH;

export default function ArtifactViewer({ artifact, isEditing, onEdit, onCancelEdit, onClose, onSave, onSaveAndStay }) {
  const { updateArtifact, deleteArtifact, loadData } = useApp();
  const [editTitle, setEditTitle] = useState(artifact.title || '');
  const [editContent, setEditContent] = useState(artifact.content || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const [showSplit, setShowSplit] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showInlineMenu, setShowInlineMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [showInlineButton, setShowInlineButton] = useState(false);
  const [charWidth, setCharWidth] = useState(8);
  const [formatCursor, setFormatCursor] = useState(null);
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const editorContainerRef = useRef(null);
  const isNote = artifact.type === 'note';

  // Update local state when artifact changes
  useEffect(() => {
    setEditTitle(artifact.title || '');
    setEditContent(artifact.content || '');
    setIsDirty(false);
  }, [artifact.id]);

  // Enable split view by default when entering edit mode
  useEffect(() => {
    if (isEditing && artifact.type === 'note') {
      setShowSplit(true);
    }
  }, [isEditing]);

  // Measure character width for cursor positioning
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const styles = window.getComputedStyle(textarea);
    ctx.font = styles.font;
    const width = ctx.measureText('m').width;
    if (width > 0) setCharWidth(width);
  }, [isEditing]);

  // Apply formatting cursor after state update
  useEffect(() => {
    if (formatCursor) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.selectionStart = formatCursor.start;
        textarea.selectionEnd = formatCursor.end;
      }
      setFormatCursor(null);
    }
  }, [editContent, formatCursor]);

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

  const handleMouseUp = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selection = selectionEnd - selectionStart;

    if (selection > 0) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setMenuAnchor({ x: rect.right + 8, y: rect.top });
        setShowInlineMenu(true);
        setShowInlineButton(false);
      }
    } else {
      const lineNum = getCurrentLine(textarea.value, selectionStart);
      setCursorLine(lineNum);
      setShowInlineButton(true);
      setShowInlineMenu(false);
    }
  };

  const handleInlineButtonClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const lineNum = getCurrentLine(textarea.value, selectionStart);
    const lineStart = textarea.value.lastIndexOf('\n', selectionStart - 1) + 1;
    const charOffset = selectionStart - lineStart;

    const textareaRect = textarea.getBoundingClientRect();
    const x = textareaRect.left + TOTAL_GUTTER_WIDTH + charOffset * charWidth;
    const y = textareaRect.top + (lineNum - 1) * LINE_HEIGHT;

    setMenuAnchor({ x, y });
    setShowInlineMenu(true);
    setShowInlineButton(false);
  };

  const handleFormat = (newText, newStart, newEnd) => {
    setEditContent(newText);
    setIsDirty(true);
    setFormatCursor({ start: newStart, end: newEnd });
  };

  const handleScroll = () => {
    const textarea = textareaRef.current;
    const gutter = gutterRef.current;
    if (textarea && gutter) {
      gutter.scrollTop = textarea.scrollTop;
    }
    setShowInlineMenu(false);
    setShowInlineButton(false);
  };


  const lineNumbers = getLineNumbers(editContent);

  const renderLineNumbersJsx = () => {
    return lineNumbers.map((line, i) => {
      const isCurrent = i + 1 === cursorLine;
      return (
        <div
          key={line}
          class={`flex items-center justify-end h-[1.625rem] px-2 ${isCurrent ? 'line-numbers-active' : 'line-number'}`}
          style={isCurrent ? { backgroundColor: 'var(--gutter-active-bg)' } : undefined}
        >
          {line}
        </div>
      );
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateArtifact(artifact.id, {
        title: editTitle,
        content: editContent,
      });
      setIsDirty(false);
      if (onSaveAndStay) {
        await onSaveAndStay();
      } else {
        onSave();
      }
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
      if (showInlineMenu) {
        e.preventDefault();
        setShowInlineMenu(false);
        return;
      }
      onCancelEdit();
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const text = textarea.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      switch (e.key.toLowerCase()) {
        case 'b': {
          e.preventDefault();
          const isSel = start !== end;
          const { s: bs, e: be } = isSel ? { s: start, e: end } : getLineRange(text, start);
          const lt = text.substring(bs, be);
          const nt = text.substring(0, bs) + '**' + lt + '**' + text.substring(be);
          setEditContent(nt);
          setIsDirty(true);
          setFormatCursor({ start: bs + 2, end: be + 2 });
          setShowInlineMenu(false);
          setShowInlineButton(false);
          break;
        }
        case 'i': {
          e.preventDefault();
          const isSel = start !== end;
          const { s: its, e: ite } = isSel ? { s: start, e: end } : getLineRange(text, start);
          const lt = text.substring(its, ite);
          const nt = text.substring(0, its) + '*' + lt + '*' + text.substring(ite);
          setEditContent(nt);
          setIsDirty(true);
          setFormatCursor({ start: its + 1, end: ite + 1 });
          setShowInlineMenu(false);
          setShowInlineButton(false);
          break;
        }
        case 'h': {
          e.preventDefault();
          const lr = getLineRange(text, start);
          const lt = text.substring(lr.start, lr.end);
          const prefix = '## ';
          const nt = text.substring(0, lr.start) + prefix + lt + text.substring(lr.end);
          setEditContent(nt);
          setIsDirty(true);
          setFormatCursor({ start: lr.start + prefix.length, end: lr.start + prefix.length });
          setShowInlineMenu(false);
          setShowInlineButton(false);
          break;
        }
        case 'k': {
          e.preventDefault();
          const isSel = start !== end;
          const { s: ls, e: le } = isSel ? { s: start, e: end } : getLineRange(text, start);
          const lt = text.substring(ls, le);
          const nt = text.substring(0, ls) + '[' + lt + ']()' + text.substring(le);
          setEditContent(nt);
          setIsDirty(true);
          setFormatCursor({ start: ls + 1, end: ls + lt.length + 1 });
          setShowInlineMenu(false);
          setShowInlineButton(false);
          break;
        }
        case '`': {
          e.preventDefault();
          const isSel = start !== end;
          const { s: cs, e: ce } = isSel ? { s: start, e: end } : getLineRange(text, start);
          const lt = text.substring(cs, ce);
          const nt = text.substring(0, cs) + '`' + lt + '`' + text.substring(ce);
          setEditContent(nt);
          setIsDirty(true);
          setFormatCursor({ start: cs + 1, end: ce + 1 });
          setShowInlineMenu(false);
          setShowInlineButton(false);
          break;
        }
        default:
          break;
      }
    }
  };

  const getLineRange = (text, pos) => {
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = text.indexOf('\n', pos);
    return {
      start: lineStart,
      end: lineEnd === -1 ? text.length : lineEnd,
    };
  };

  if (isEditing && artifact.type === 'note') {
    return (
      <div class="h-full flex flex-col" onKeyDown={handleKeyDown}>
        {/* Edit header */}
        <div class="flex items-center gap-2 p-3 border-b theme-border shrink-0">
          <button
            onClick={onCancelEdit}
            class="theme-text-secondary hover:theme-text transition-colors p-1.5 rounded"
            title="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class={`text-xs px-2 py-0.5 rounded capitalize ${isNote ? 'bg-[var(--text-accent)]/20 text-[var(--text-accent)]' : 'bg-[var(--btn-primary)]/20 text-[var(--btn-primary)]'}`}>
            {artifact.type}
          </span>
          <div class="w-px h-5 bg-[var(--border-color)]" />
          <button
            onClick={() => setShowSplit(!showSplit)}
            class={`p-1.5 rounded transition-colors ${showSplit ? 'theme-text' : 'theme-text-secondary'} hover:bg-white/5 hover:text-yellow-300`}
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
            class="theme-text-secondary hover:text-[var(--btn-primary)] disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded transition-colors hover:bg-white/5"
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
            class="theme-text-secondary hover:text-[var(--btn-danger)] p-1.5 rounded transition-colors hover:bg-white/5"
            title="Delete"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          {isDirty && (
            <span class="text-xs theme-text-secondary ml-auto">Not saved</span>
          )}
        </div>

        <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Title bar */}
          <div class="px-4 pt-3 pb-1 shrink-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setIsDirty(true); }}
              placeholder="Artifact title..."
              class="w-full text-xl font-bold bg-transparent border-none outline-none theme-text"
            />
          </div>

          {/* Editor + Preview area */}
          <div class="flex-1 min-h-0 px-4 pb-4 overflow-hidden">
            {showSplit ? (
              <div class="h-full flex gap-3">
                {/* Editor pane */}
                <div class="flex-1 min-w-0 flex flex-col">
                  <div class="text-xs text-[var(--text-secondary)]/60 mb-1.5 font-medium uppercase tracking-wider">Edit</div>
                  <div class="flex-1 min-h-0 relative border editor-pane-border rounded" ref={editorContainerRef}>
                    <div
                      ref={gutterRef}
                      class="absolute left-0 top-0 bottom-0 w-12 theme-bg-panel line-numbers-gutter text-sm font-mono text-right select-none overflow-hidden py-3 border-r gutter-border z-10"
                    >
                      {renderLineNumbersJsx()}
                    </div>
                    <div class="absolute left-12 top-0 bottom-0 w-8 format-gutter z-[100]">
                      {showInlineButton && charWidth > 0 && (
                        <div
                          class="absolute left-0 w-8 flex items-center justify-center"
                          style={{ top: `${(cursorLine - 1) * LINE_HEIGHT + 12}px` }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleInlineButtonClick(); }}
                            class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
                            title="Formatting"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onInput={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
                      onMouseUp={handleMouseUp}
                      onClick={handleCursorMove}
                      onKeyUp={handleCursorMove}
                      onSelect={handleCursorMove}
                      onScroll={handleScroll}
                      placeholder="Start writing..."
                      class="absolute left-20 right-0 top-0 bottom-0 resize-none bg-transparent border-none outline-none text-sm theme-text font-mono p-3"
                      spellCheck
                      style={{ lineHeight: '1.625rem' }}
                    />
                    {showInlineMenu && (
                      <InlineMenu
                        anchor={menuAnchor}
                        mode="cursor"
                        text={editContent}
                        selectionStart={textareaRef.current?.selectionStart ?? 0}
                        selectionEnd={textareaRef.current?.selectionEnd ?? 0}
                        onFormat={handleFormat}
                        onClose={() => { setShowInlineMenu(false); setShowInlineButton(false); }}
                      />
                    )}
                  </div>
                </div>
                {/* Preview pane */}
                <div class="flex-1 min-w-0 flex flex-col">
                  <div class="text-xs text-[var(--text-secondary)]/60 mb-1.5 font-medium uppercase tracking-wider">Preview</div>
                  <div class="flex-1 min-h-0 border editor-pane-border rounded overflow-y-auto p-4 theme-bg-panel">
                    <div
                      class="prose prose-sm max-w-none theme-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                    />
                    {!editContent && (
                      <p class="text-[var(--text-secondary)]/40 text-sm italic">Nothing to preview yet...</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div class="h-full flex flex-col">
                <div class="flex-1 min-h-0 relative border editor-pane-border rounded" ref={editorContainerRef}>
                    <div
                      ref={gutterRef}
                      class="absolute left-0 top-0 bottom-0 w-12 theme-bg-panel line-numbers-gutter text-sm font-mono text-right select-none overflow-hidden py-3 border-r gutter-border z-10"
                    >
                      {renderLineNumbersJsx()}
                    </div>
                    <div class="absolute left-12 top-0 bottom-0 w-8 format-gutter z-[100]">
                      {showInlineButton && charWidth > 0 && (
                        <div
                          class="absolute left-0 w-8 flex items-center justify-center"
                          style={{ top: `${(cursorLine - 1) * LINE_HEIGHT + 12}px` }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleInlineButtonClick(); }}
                            class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
                            title="Formatting"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onInput={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
                    onMouseUp={handleMouseUp}
                    onClick={handleCursorMove}
                    onKeyUp={handleCursorMove}
                    onSelect={handleCursorMove}
                    onScroll={handleScroll}
                    placeholder="Start writing..."
                    class="absolute left-20 right-0 top-0 bottom-0 resize-none bg-transparent border-none outline-none text-sm theme-text font-mono p-3"
                    spellCheck
                    style={{ lineHeight: '1.625rem' }}
                  />
                  {showInlineMenu && (
                    <InlineMenu
                      anchor={menuAnchor}
                      mode="cursor"
                      text={editContent}
                      selectionStart={textareaRef.current?.selectionStart ?? 0}
                      selectionEnd={textareaRef.current?.selectionEnd ?? 0}
                      onFormat={handleFormat}
                      onClose={() => { setShowInlineMenu(false); setShowInlineButton(false); }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View mode
  const metadata = artifact.metadata || {};

  return (
    <div class="h-full flex flex-col">
      {/* View header */}
      <div class="flex items-center gap-2 p-3 border-b theme-border shrink-0">
        <button
          onClick={onClose}
          class="theme-text-secondary hover:theme-text transition-colors p-1.5 rounded"
          title="Back to list"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class={`text-xs px-2 py-0.5 rounded capitalize ${isNote ? 'bg-[var(--text-accent)]/20 text-[var(--text-accent)]' : 'bg-[var(--btn-primary)]/20 text-[var(--btn-primary)]'}`}>
          {artifact.type}
        </span>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <h1 class="text-2xl font-bold theme-text mb-4">{artifact.title || 'Untitled'}</h1>

        <div class="max-w-[70ch]">
          {/* Tags */}
          {artifact.tagNames?.length > 0 && (
            <div class="flex flex-wrap gap-1.5 mb-4">
              {artifact.tagNames.map((tag) => (
                <span key={tag} class="text-xs bg-[var(--border-color)]/30 theme-text-secondary px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Note content */}
          {isNote ? (
            <div
              class="prose prose-sm max-w-none theme-text"
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
                <p class="text-xs theme-text-secondary mt-2">
                  {metadata.width} x {metadata.height}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div class="mt-6 pt-4 border-t theme-border text-xs theme-text-secondary">
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
    </div>
  );
}
