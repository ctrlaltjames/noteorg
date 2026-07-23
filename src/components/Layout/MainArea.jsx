import { useState, useCallback, useEffect } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import { useAppState } from '../../context/AppStateContext';
import NoteEditor from '../Editor/NoteEditor';
import ImageGallery from '../Gallery/ImageGallery';

export default function MainArea() {
  const { readFile, writeFile } = useFileSystem();
  const { selectedNote, handleSelectNote, sidebarTab, setSidebarTab, noteTags, handleUpdateNoteTags } = useAppState();
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('note');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedNote?.name.endsWith('.md')) {
      setViewMode('note');
    }
  }, [selectedNote]);

  const handleSelectNoteItem = useCallback(async (item) => {
    if (!item.name.endsWith('.md')) return;
    handleSelectNote(item);
    try {
      const text = await readFile(item.path);
      setContent(text || '');
    } catch (e) {
      setContent('');
    }
  }, [readFile, handleSelectNote]);

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

  const handleCreateNote = useCallback(async () => {
    const name = `note-${Date.now()}.md`;
    const defaultContent = `---\ntitle: "Untitled"\ntags: []\ncreated: ${new Date().toISOString().split('T')[0]}\n---\n\nStart writing...\n`;

    try {
      await writeFile(name, defaultContent);
      const newItem = { name, path: name, kind: 'file' };
      handleSelectNote(newItem);
      setContent(defaultContent);
      setViewMode('note');
    } catch (e) {
      // ignore
    }
  }, [writeFile, handleSelectNote]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="h-10 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
        <button
          onClick={handleCreateNote}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <span>+</span> New Note
        </button>

        {selectedNote && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => setViewMode('note')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'note'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Gallery
            </button>
          </>
        )}

        <div className="flex-1" />

        {saving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
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
