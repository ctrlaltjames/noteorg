import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting } from '@codemirror/language';
import { parseFrontmatter, buildFrontmatter } from '../../utils/markdown';
import { getNoteTags, setNoteTags } from '../../utils/tags';
import MarkdownPreview from './MarkdownPreview';

const theme = EditorView.theme({
  '.cm-editor': {
    height: '100%',
    background: 'transparent',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
  },
  '.cm-content': {
    padding: '16px',
  },
  '.cm-line': {
    minHeight: '1.6em',
  },
});

export default function NoteEditor({ notePath, content, onChange, onSave }) {
  const [view, setView] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [noteTags, setNoteTagsState] = useState([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!notePath) return;
    const tags = getNoteTags(content || '');
    setNoteTagsState(tags);
  }, [notePath, content]);

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: content || '',
      extensions: [
        basicSetup,
        markdown({
          base: markdownLanguage,
          codeLanguages: { js: 'javascript', py: 'python', html: 'html', css: 'css' },
        }),
        theme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.editable.of(!!notePath),
      ],
    });

    const newView = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    setView(newView);

    return () => {
      newView.destroy();
      setView(null);
    };
  }, [notePath]);

  useEffect(() => {
    if (!view || view.state.doc.toString() === (content || '')) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content || '' },
    });
  }, [content, view]);

  const handleSave = useCallback(() => {
    if (onSave) onSave();
  }, [onSave]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSplitMode((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setPreviewMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || noteTags.includes(tag)) return;
    const newTags = [...noteTags, tag];
    setNoteTagsState(newTags);
    const newContent = setNoteTags(content || '', newTags);
    onChange(newContent);
    setTagInput('');
  }, [tagInput, noteTags, content, onChange]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    const newTags = noteTags.filter((t) => t !== tagToRemove);
    setNoteTagsState(newTags);
    const newContent = setNoteTags(content || '', newTags);
    onChange(newContent);
  }, [noteTags, content, onChange]);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  if (!notePath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select a note to edit
          </h2>
          <p className="text-gray-500">
            Choose a markdown file from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="h-auto bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-2 shrink-0 flex-wrap">
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            previewMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setSplitMode(!splitMode)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            splitMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Split
        </button>

        {/* Tag toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400">{'\u{1F3F7}'}</span>
          {noteTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-blue-400 hover:text-blue-700 transition-colors"
              >
                {'\u00D7'}
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="+ Add tag"
            className="w-20 px-1.5 py-0.5 text-xs border border-gray-200 rounded-full bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex-1" />
        <span className="text-xs text-gray-400 truncate max-w-xs">
          {notePath.split('/').pop()}
        </span>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex">
        {(!previewMode || splitMode) && (
          <div className={`${splitMode ? 'w-1/2 border-r border-gray-200' : 'w-full'} h-full`}>
            <div ref={editorRef} className="h-full" />
          </div>
        )}
        {(!previewMode || splitMode) && previewMode && (
          <div className={`${splitMode ? 'w-1/2' : 'w-full'} h-full overflow-y-auto`}>
            <div ref={previewRef} className="p-6 prose max-w-none">
              <MarkdownPreview content={content || ''} />
            </div>
          </div>
        )}
        {previewMode && !splitMode && (
          <div className="w-full h-full overflow-y-auto">
            <div ref={previewRef} className="p-6 prose max-w-none">
              <MarkdownPreview content={content || ''} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
