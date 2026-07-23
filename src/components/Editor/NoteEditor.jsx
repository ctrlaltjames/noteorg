import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { bracketMatching } from '@codemirror/language';
import { highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { parseFrontmatter, buildFrontmatter } from '../../utils/markdown';
import { getNoteTags, setNoteTags } from '../../utils/tags';
import MarkdownPreview from './MarkdownPreview';

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-content': {
    padding: '0',
    color: '#111827',
    lineHeight: '1.7',
  },
  '.cm-line': {
    color: '#111827',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    lineHeight: '1.7',
    overflowX: 'auto',
  },
  '.cm-cursor': {
    borderLeftColor: '#111827',
  },
  '.cm-activeLine': {
    background: 'transparent',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-selectionBackground': {
    background: '#60a5fa',
  },
  '.cm-selection': {
    background: '#60a5fa',
  },
  '.cm-line .cm-selection': {
    background: '#60a5fa',
  },
  '.cm-selectionMatch': {
    background: '#bfdbfe !important',
    color: '#1e40af',
  },
  '.cm-matchingBracket': {
    background: '#bfdbfe',
  },
  '.cm-lineNumber': {
    color: '#9ca3af',
    fontSize: '12px',
  },
  '.cm-gutters': {
    background: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    color: '#6b7280',
  },
  '.cm-tooltip-autocomplete': {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontSize: '13px',
  },
  '.cm-tooltip-autocomplete > div': {
    padding: '4px 8px',
  },
  '.cm-tooltip-autocomplete > div[aria-selected]': {
    background: '#eff6ff',
  },
  '.cm-panel': {
    background: '#ffffff',
    color: '#111827',
  },
  '.cm-panel search': {
    color: '#111827',
  },
});

const MD_BUTTONS = [
  { label: 'H1', insert: '# ', title: 'Heading 1' },
  { label: 'H2', insert: '## ', title: 'Heading 2' },
  { label: 'H3', insert: '### ', title: 'Heading 3' },
  { label: 'B', insert: null, command: 'toggleBold', title: 'Bold' },
  { label: 'I', insert: null, command: 'toggleItalic', title: 'Italic' },
  { label: 'S', insert: null, command: 'toggleStrike', title: 'Strikethrough' },
  { label: '"', insert: null, command: 'toggleQuote', title: 'Blockquote' },
  { label: '<>', insert: null, command: 'toggleCode', title: 'Inline Code' },
  { label: 'Code', insert: null, command: 'toggleCodeBlock', title: 'Code Block' },
  { label: '•', insert: null, command: 'toggleBullet', title: 'Bullet List' },
  { label: '1.', insert: null, command: 'toggleNumbered', title: 'Numbered List' },
  { label: '[]', insert: null, command: 'toggleCheck', title: 'Task List' },
  { label: '🔗', insert: null, command: 'insertLink', title: 'Link' },
  { label: '—', insert: null, command: 'insertHR', title: 'Horizontal Rule' },
];

function insertAtCursor(view, prefix, suffix = '') {
  if (!view || view.destroyed) return;
  const state = view.state;
  const docLen = state.doc.length;
  const selection = state.selection;
  const from = Math.min(selection.from, docLen);
  const to = Math.min(selection.to, docLen);
  const text = state.sliceDoc(from, to);
  const insertion = prefix + text + suffix;
  const tr = state.transaction({
    changes: { from, to, insert: insertion },
    selection: { anchor: Math.min(from + prefix.length, docLen + insertion.length) },
  });
  view.dispatch(tr);
  view.focus();
}

function wrapLine(view, prefix, suffix) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const line = state.selection.ranges[0];
  const lineObj = state.doc.lineAt(line.from);
  const lineStart = lineObj.from;
  const lineEnd = lineObj.to;
  const lineText = state.sliceDoc(lineStart, lineEnd);
  const trimmed = lineText.trim();

  if (trimmed === '') {
    const tr = state.transaction({
      changes: { from: lineStart, to: lineEnd, insert: prefix + suffix },
      selection: { anchor: lineStart + prefix.length },
    });
    view.dispatch(tr);
  } else {
    const newLine = prefix + lineText + suffix;
    const tr = state.transaction({
      changes: { from: lineStart, to: lineEnd, insert: newLine },
    });
    view.dispatch(tr);
  }
  view.focus();
}

function toggleBold(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const { from, to } = state.selection;
  const text = state.sliceDoc(from, to);

  const tr = state.transaction({
    changes: { from, to, insert: text.startsWith('**') && text.endsWith('**') ? text.slice(2, -2) : `**${text}**` },
  });
  view.dispatch(tr);
  view.focus();
}

function toggleItalic(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const { from, to } = state.selection;
  const text = state.sliceDoc(from, to);

  const tr = state.transaction({
    changes: { from, to, insert: text.startsWith('*') && text.endsWith('*') && !text.startsWith('**') ? text.slice(1, -1) : `*${text}*` },
  });
  view.dispatch(tr);
  view.focus();
}

function toggleStrike(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const { from, to } = state.selection;
  const text = state.sliceDoc(from, to);

  const tr = state.transaction({
    changes: { from, to, insert: text.startsWith('~~') && text.endsWith('~~') ? text.slice(2, -2) : `~~${text}~~` },
  });
  view.dispatch(tr);
  view.focus();
}

function toggleQuote(view) {
  wrapLine(view, '> ', '');
}

function toggleCode(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const { from, to } = state.selection;
  const text = state.sliceDoc(from, to);

  const tr = state.transaction({
    changes: { from, to, insert: text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1) : `\`${text}\`` },
  });
  view.dispatch(tr);
  view.focus();
}

function toggleCodeBlock(view) {
  wrapLine(view, '```\n', '\n```');
}

function toggleBullet(view) {
  wrapLine(view, '- ', '');
}

function toggleNumbered(view) {
  wrapLine(view, '1. ', '');
}

function toggleCheck(view) {
  wrapLine(view, '- [ ] ', '');
}

function insertLink(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const { from, to } = state.selection;
  const text = state.sliceDoc(from, to);

  if (text) {
    const tr = state.transaction({
      changes: { from, to, insert: `[${text}](url)` },
      selection: { anchor: from + text.length + 4 },
    });
    view.dispatch(tr);
  } else {
    const tr = state.transaction({
      changes: { from, to, insert: '[](url)' },
      selection: { anchor: from + 1 },
    });
    view.dispatch(tr);
  }
  view.focus();
}

function insertHR(view) {
  if (!view || view.destroyed) return;
  const state = view.state;
  const pos = state.selection.from;
  const tr = state.transaction({
    changes: { from: pos, to: pos, insert: '\n---\n' },
  });
  view.dispatch(tr);
  view.focus();
}

const mdCommands = {
  toggleBold,
  toggleItalic,
  toggleStrike,
  toggleQuote,
  toggleCode,
  toggleCodeBlock,
  toggleBullet,
  toggleNumbered,
  toggleCheck,
  insertLink,
  insertHR,
};

export default function NoteEditor({ notePath, content, onChange, onSave, onDelete }) {
  const [previewMode, setPreviewMode] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [noteTags, setNoteTagsState] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastSyncedContentRef = useRef('');
  const syncingRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!notePath) return;
    const tags = getNoteTags(content || '');
    setNoteTagsState(tags);
  }, [notePath, content]);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      highlightSpecialChars(),
      drawSelection(),
      bracketMatching(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      markdown({
        base: markdownLanguage,
        codeLanguages: {
          js: 'javascript', py: 'python', html: 'html', css: 'css',
          ts: 'typescript', bash: 'bash', sql: 'sql', rust: 'rust',
          go: 'go', java: 'java', json: 'json',
        },
      }),
      editorTheme,
      EditorView.editable.of(!!notePath),
    ];

    const startState = EditorState.create({
      doc: content || '',
      extensions,
    });

    const newView = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = newView;
    lastSyncedContentRef.current = content || '';
    setTimeout(() => newView.focus(), 0);

    return () => {
      newView.destroy();
      viewRef.current = null;
    };
  }, [notePath]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (content === lastSyncedContentRef.current) return;
    if (syncingRef.current) return;
    const doc = content || '';
    const current = view.state.doc.toString();
    if (current !== doc) {
      try {
        const state = view.state;
        const tr = state.transaction({
          changes: { from: 0, to: state.doc.length, insert: doc },
        });
        view.dispatch(tr);
        lastSyncedContentRef.current = doc;
      } catch (err) {
        if (err.message && err.message.includes('wrong length')) {
          const state = view.state;
          const updated = state.doc.toString();
          if (updated !== doc) {
            const tr = state.transaction({
              changes: { from: 0, to: state.doc.length, insert: doc },
            });
            view.dispatch(tr);
            lastSyncedContentRef.current = doc;
          }
        } else {
          throw err;
        }
      }
    }
  }, [content]);

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

  const handleMdAction = useCallback((btn) => {
    const currentView = viewRef.current;
    if (!currentView || currentView.destroyed) return;
    syncingRef.current = true;
    try {
      const docLen = currentView.state.doc.length;
      const selection = currentView.state.selection;
      const from = Math.max(0, Math.min(selection.from, docLen));
      const to = Math.max(0, Math.min(selection.to, docLen));
      if (from > to) {
        syncingRef.current = false;
        return;
      }
      if (btn.command && mdCommands[btn.command]) {
        mdCommands[btn.command](currentView);
      } else if (btn.insert !== null && btn.insert !== undefined) {
        insertAtCursor(currentView, btn.insert);
      }
    } catch (err) {
      syncingRef.current = false;
      return;
    } finally {
      syncingRef.current = false;
    }
  }, []);

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
      {/* Markdown toolbar */}
      <div className="h-9 bg-gray-50 border-b border-gray-200 flex items-center px-2 gap-0.5 shrink-0">
        {MD_BUTTONS.map((btn) => (
          <button
            key={btn.title}
            onPointerDown={(e) => {
              e.preventDefault();
              handleMdAction(btn);
            }}
            title={btn.title}
            className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          onClick={() => setPreviewMode(!previewMode)}
          title={`Preview (Ctrl+P)`}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            previewMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setSplitMode(!splitMode)}
          title={`Split (Ctrl+B)`}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            splitMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Split
        </button>
      </div>

      {/* Tag bar */}
      <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-1.5 shrink-0">
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
        <div className="flex-1" />
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex">
        {(!previewMode || splitMode) && (
          <div className={`${splitMode ? 'w-1/2 border-r border-gray-200' : 'w-full'} h-full`}>
            <div ref={editorRef} className="h-full noteorg-editor" />
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
