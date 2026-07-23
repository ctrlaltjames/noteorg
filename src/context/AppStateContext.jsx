import { createContext } from 'preact';
import { useContext, useState, useCallback, useRef, useEffect } from 'preact/hooks';
import { indexNotes, search, loadCachedIndex } from '../utils/search';
import { loadTags, addTag, removeTag, updateTag, getAllTagsFromNotes } from '../utils/tags';
import { useFileSystem } from './FileSystemContext';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const fileSystem = useFileSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [tags, setTags] = useState(() => loadTags());
  const [allNoteTags, setAllNoteTags] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteContents, setNoteContents] = useState({});
  const [noteTitles, setNoteTitles] = useState({});
  const [noteTags, setNoteTags] = useState({});
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [tagEditorMode, setTagEditorMode] = useState('create');
  const [tagEditorValue, setTagEditorValue] = useState('');
  const [sidebarTab, setSidebarTab] = useState('explorer');
  const searchTimeoutRef = useRef(null);
  const searchIndexRef = useRef(null);
  const notesRef = useRef([]);

  const allNotes = notesRef.current;

  useEffect(() => {
    const cached = loadCachedIndex();
    if (cached) {
      searchIndexRef.current = cached.index;
      notesRef.current = cached.notes;
    }
  }, []);

  const rebuildIndex = useCallback(async () => {
    if (!fileSystem?.directoryHandle) return;

    const notes = [];
    const scanDir = async (path) => {
      try {
        const items = await fileSystem.listDirectory(path);
        for (const item of items) {
          if (item.kind === 'file' && item.name.endsWith('.md')) {
            try {
              const content = await fileSystem.readFile(item.path);
              const titleMatch = content?.match(/^title:\s*["']([^"']+)["']/m);
              const tagsMatch = content?.match(/^tags:\s*\[([^\]]*)\]/m);
              notes.push({
                path: item.path,
                name: item.name,
                title: titleMatch?.[1] || '',
                tags: tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [],
                content: content || '',
                type: 'note',
              });
            } catch (e) {
              // skip unreadable files
            }
          } else if (item.kind === 'directory') {
            await scanDir(item.path);
          }
        }
      } catch (e) {
        // skip unreadable dirs
      }
    };

    await scanDir('');
    notesRef.current = notes;
    searchIndexRef.current = indexNotes(notes);
    setAllNoteTags(getAllTagsFromNotes(notes));

    const noteTagsMap = {};
    const noteTitlesMap = {};
    for (const note of notes) {
      noteTagsMap[note.path] = note.tags;
      noteTitlesMap[note.path] = note.title;
    }
    setNoteTags(noteTagsMap);
    setNoteTitles(noteTitlesMap);
  }, [fileSystem]);

  useEffect(() => {
    if (fileSystem?.directoryHandle) {
      rebuildIndex();
    }
  }, [fileSystem?.directoryHandle, rebuildIndex]);

  const performSearch = useCallback(
    (query) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (!query || query.length < 2) {
          setSearchResults([]);
          return;
        }
        if (searchIndexRef.current) {
          const results = search(searchIndexRef.current, query);
          setSearchResults(results);
        }
      }, 250);
    },
    []
  );

  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      performSearch(value);
    },
    [performSearch]
  );

  const handleSelectResult = useCallback(
    (result) => {
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      if (result.type === 'note') {
        setSelectedNote({ path: result.path, name: result.name });
        setSidebarTab('explorer');
      }
    },
    []
  );

  const handleSelectNote = useCallback(
    (note) => {
      setSelectedNote(note);
      setSearchOpen(false);
    },
    []
  );

  const handleTagClick = useCallback((tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
    if (searchIndexRef.current && tag) {
      const results = search(searchIndexRef.current, tag);
      setSearchResults(results.filter((r) => (r.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())));
      setSearchOpen(true);
    } else if (!tag) {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, []);

  const handleAddTag = useCallback(
    (tagName) => {
      const newTags = addTag(tags, tagName);
      setTags(newTags);
    },
    [tags]
  );

  const handleRemoveTag = useCallback(
    (tagName) => {
      const newTags = removeTag(tags, tagName);
      setTags(newTags);
      if (activeTag === tagName) {
        setActiveTag(null);
      }
    },
    [tags, activeTag]
  );

  const handleUpdateTag = useCallback(
    (oldName, newName) => {
      const newTags = updateTag(tags, oldName, newName);
      setTags(newTags);
    },
    [tags]
  );

  const handleOpenTagEditor = useCallback((mode = 'create', value = '') => {
    setTagEditorMode(mode);
    setTagEditorValue(value);
    setShowTagEditor(true);
  }, []);

  const handleSaveTagEditor = useCallback(() => {
    if (tagEditorMode === 'create') {
      handleAddTag(tagEditorValue);
    } else if (tagEditorMode === 'rename') {
      handleUpdateTag(tagEditorValue, tagEditorValue);
    }
    setTagEditorValue('');
    setShowTagEditor(false);
  }, [tagEditorMode, tagEditorValue, handleAddTag, handleUpdateTag]);

  const handleDeleteTagFromEditor = useCallback(() => {
    if (tagEditorMode === 'rename') {
      handleRemoveTag(tagEditorValue);
    }
    setTagEditorValue('');
    setShowTagEditor(false);
  }, [tagEditorMode, tagEditorValue, handleRemoveTag]);

  const handleUpdateNoteTags = useCallback((notePath, tags) => {
    setNoteTags((prev) => ({ ...prev, [notePath]: tags }));
    if (noteTitles[notePath]) {
      notesRef.current = notesRef.current.map((n) =>
        n.path === notePath ? { ...n, tags } : n
      );
      setNoteTitles((prev) => ({ ...prev, [notePath]: noteTitles[notePath] }));
      searchIndexRef.current = indexNotes(notesRef.current);
    }
  }, [noteTitles]);

  const value = {
    searchQuery,
    searchResults,
    searchOpen,
    setSearchOpen,
    handleSearchChange,
    handleSelectResult,
    activeTag,
    handleTagClick,
    tags,
    allNoteTags,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    showTagEditor,
    tagEditorMode,
    tagEditorValue,
    setTagEditorValue,
    handleOpenTagEditor,
    handleSaveTagEditor,
    handleDeleteTagFromEditor,
    setShowTagEditor,
    selectedNote,
    handleSelectNote,
    sidebarTab,
    setSidebarTab,
    noteTags,
    handleUpdateNoteTags,
    rebuildIndex,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
