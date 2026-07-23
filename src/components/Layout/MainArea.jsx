import { useState, useCallback, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import { useAppState } from '../../context/AppStateContext';
import NoteEditor from '../Editor/NoteEditor';
import ImageGallery from '../Gallery/ImageGallery';

export default function MainArea() {
  const { writeFile, deleteFile } = useFileSystem();
  const { selectedNote, handleSelectNote, sidebarTab, setSidebarTab, noteTags, handleUpdateNoteTags, noteContents, setNoteContents } = useAppState();
  const [viewMode, setViewMode] = useState('note');
  const [saving, setSaving] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);

  const content = selectedNote?.path ? (noteContents[selectedNote.path] || '') : '';
  const setContent = useCallback((newContent) => {
    if (selectedNote?.path) {
      setNoteContents((prev) => ({ ...prev, [selectedNote.path]: newContent }));
    }
  }, [selectedNote?.path]);

  useEffect(() => {
    if (selectedNote?.name.endsWith('.md')) {
      setViewMode('note');
    }
  }, [selectedNote]);

  const handleSave = useCallback(async () => {
    if (!selectedNote || !content) return;
    setSaving(true);
    try {
      await writeFile(selectedNote.path, content);
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [selectedNote, content, writeFile]);

  const handleCreateNote = useCallback(() => {
    setNewNoteName('');
    setShowNewNoteInput(true);
  }, []);

  const handleConfirmCreateNote = useCallback(async () => {
    let name = newNoteName.trim();
    if (!name) {
      name = `note-${Date.now()}.md`;
    } else if (!name.endsWith('.md')) {
      name += '.md';
    }
    setShowNewNoteInput(false);
    const defaultContent = `---\ntitle: "${name.replace('.md', '').replace(/-/g, ' ')}"\ntags: []\ncreated: ${new Date().toISOString().split('T')[0]}\n---\n\nStart writing...\n`;

    try {
      await writeFile(name, defaultContent);
      const newItem = { name, path: name, kind: 'file' };
      handleSelectNote(newItem);
      setContent(defaultContent);
      setViewMode('note');
    } catch (e) {
      // ignore
    }
  }, [newNoteName, writeFile, handleSelectNote]);

  const handleCancelCreateNote = useCallback(() => {
    setShowNewNoteInput(false);
    setNewNoteName('');
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedNote) return;
    if (!window.confirm(`Delete "${selectedNote.name}"?`)) return;
    try {
      await deleteFile(selectedNote.path);
      setNoteContents((prev) => {
        const next = { ...prev };
        delete next[selectedNote.path];
        return next;
      });
      handleSelectNote(null);
    } catch (e) {
      // ignore
    }
  }, [selectedNote, deleteFile, handleSelectNote, setNoteContents]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 gap-2 shrink-0">
        {showNewNoteInput ? (
          <>
            <input
              type="text"
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateNote();
                if (e.key === 'Escape') handleCancelCreateNote();
              }}
              placeholder="note-name.md"
              className="px-2 py-1 text-xs border border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 w-36"
              autoFocus
            />
            <button
              onClick={handleConfirmCreateNote}
              className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
            <button
              onClick={handleCancelCreateNote}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleCreateNote}
            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <span>+</span> New Note
          </button>
        )}

        {selectedNote && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => setViewMode('note')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'note'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Gallery
            </button>
          </>
        )}

        <div className="flex-1" />

        {saving && (
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <span className="w-3 h-3 border border-gray-400 dark:border-gray-500 border-t-transparent dark:border-t-gray-300 rounded-full animate-spin inline-block" />
            Saving...
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'note' ? (
          <NoteEditor
            notePath={selectedNote?.path}
            content={content}
            onChange={setContent}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <ImageGallery
            images={[]}
            selectedPath={selectedNote?.path}
            onSelect={() => {}}
          />
        )}
      </div>
    </main>
  );
}
