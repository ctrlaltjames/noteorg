import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
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

const customHighlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: 'bold', fontSize: '1.2em', color: '#111827' },
  { tag: tags.strong, fontWeight: 'bold', color: '#111827' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#4b5563' },
  { tag: tags.quote, color: '#6b7280', borderLeft: '3px solid #d1d5db', paddingLeft: '12px' },
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.code, color: '#d73a49', background: '#f6f8fa' },
  { tag: tags.codeBlock, color: '#24292f', background: '#f6f8fa' },
  { tag: tags.tagName, color: '#d73a49' },
  { tag: tags.attributeName, color: '#0055aa' },
  { tag: tags.number, color: '#0055aa' },
  { tag: tags.url, color: '#22863a' },
  { tag: tags.atom, color: '#0055aa' },
  { tag: tags.bool, color: '#0055aa' },
  { tag: tags.keyword, color: '#d73a49' },
]);

export default function NoteEditor({ notePath, content, onChange, onSave }) {
  const [view, setView] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const editorRef = useRef(null);
  const previewRef = useRef(null);

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
        customHighlight,
        syntaxHighlighting(customHighlight),
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

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
      <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
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
