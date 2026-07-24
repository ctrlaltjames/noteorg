import { createContext } from 'preact';
import { useState, useCallback, useContext, useEffect, useRef } from 'preact/hooks';
import { supabase } from '@lib/supabase';

const AppContext = createContext();

export function AppProvider({ children, user }) {
  const [rawArtifacts, setRawArtifacts] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refs to avoid stale closures in applyFilters
  const searchQueryRef = useRef(searchQuery);
  const activeTagRef = useRef(activeTag);
  const activeFolderRef = useRef(activeFolder);

  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { activeTagRef.current = activeTag; }, [activeTag]);
  useEffect(() => { activeFolderRef.current = activeFolder; }, [activeFolder]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Filter raw artifacts by search query in real-time
  useEffect(() => {
    if (!searchQuery) {
      setArtifacts(rawArtifacts);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = rawArtifacts
      .map((a) => {
        const title = (a.title || '').toLowerCase();
        const content = (a.content || '').toLowerCase();
        const titleMatch = title.includes(q);
        const contentMatch = content.includes(q);
        const tagMatch = a.tagNames.some((t) => t.toLowerCase().includes(q));
        let score = 0;
        if (titleMatch) score += 3;
        if (contentMatch) score += 1;
        if (tagMatch) score += 2;
        return { ...a, _score: score };
      })
      .filter((a) => a._score > 0)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...rest }) => rest);
    setArtifacts(filtered);
  }, [rawArtifacts, searchQuery]);

  // Fetch all artifacts with optional filters
  const fetchArtifacts = useCallback(async (query, tag, folder) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch tag names for all artifacts
      let artifactList = (data || []).map((item) => ({
        ...item,
        tagNames: [],
        folder: null,
      }));

      if (artifactList.length > 0) {
        const artifactIds = artifactList.map((a) => a.id);
        const { data: tagData } = await supabase
          .from('artifact_tags')
          .select('artifact_id, tag_id')
          .in('artifact_id', artifactIds);

        const { data: tagDetails } = await supabase
          .from('tags')
          .select('id, name, color')
          .in('id', tagData ? tagData.map((t) => t.tag_id) : []);

        const tagMap = {};
        if (tagDetails) {
          tagDetails.forEach((t) => {
            if (!tagMap[t.id]) tagMap[t.id] = { name: t.name, color: t.color || '#58a6ff' };
          });
        }

        artifactList = artifactList.map((a) => {
          const artifactTags = tagData ? tagData.filter((t) => t.artifact_id === a.id) : [];
          a.tagNames = artifactTags
            .map((t) => tagMap[t.tag_id])
            .filter(Boolean);
          return a;
        });

        // Load folder names for artifacts that have a folder_id
        const folderIds = [...new Set(artifactList.filter(a => a.folder_id).map(a => a.folder_id))];
        if (folderIds.length > 0) {
          const { data: folderData } = await supabase
            .from('folders')
            .select('id, name')
            .in('id', folderIds);
          const folderMap = {};
          if (folderData) {
            folderData.forEach((f) => { folderMap[f.id] = f.name; });
          }
        artifactList = artifactList.map((a) => {
          if (a.folder_id && folderMap[a.folder_id]) {
            a.folder = { name: folderMap[a.folder_id] };
          }
          return a;
        });
        }
      }

      // Filter and rank by search query
      if (query) {
        const q = query.toLowerCase();
        artifactList = artifactList
          .map((a) => {
            const title = (a.title || '').toLowerCase();
            const content = (a.content || '').toLowerCase();
            const titleMatch = title.includes(q);
            const contentMatch = content.includes(q);
            const tagMatch = a.tagNames.some((t) => t.name.toLowerCase().includes(q));
            let score = 0;
            if (titleMatch) score += 3;
            if (contentMatch) score += 1;
            if (tagMatch) score += 2;
            return { ...a, _score: score };
          })
          .filter((a) => a._score > 0)
          .sort((a, b) => b._score - a._score);
        artifactList = artifactList.map(({ _score, ...rest }) => rest);
      }

      // Filter by tag if specified
      if (tag) {
        artifactList = artifactList.filter((a) => a.tagNames.some((t) => t.name === tag));
      }

      // Filter by folder if specified
      if (folder) {
        artifactList = artifactList.filter((a) => a.folder_id === folder);
      }

      setRawArtifacts(artifactList);
    } catch (err) {
      console.error('Failed to fetch artifacts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all tags for the user
  const fetchTags = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (!error && data) {
      const defaultColors = ['#58a6ff', '#3fb950', '#f0883e', '#a371f7', '#f7784b', '#db61a2', '#56d4dd', '#e3b22e', '#79c0ff', '#7ee787', '#d2a8ff', '#ff7b72'];
      const tagsWithColors = data.map((tag) => ({
        ...tag,
        color: tag.color || defaultColors[Math.floor(Math.random() * defaultColors.length)],
      }));
      setTags(tagsWithColors);
      // Update tags without colors in DB
      const needsUpdate = tagsWithColors.filter((t) => !t.color || t.color === '#58a6ff');
      if (needsUpdate.length > 0) {
        for (const tag of needsUpdate) {
          await supabase
            .from('tags')
            .update({ color: tag.color })
            .eq('id', tag.id);
        }
      }
    }
  }, [user]);

  // Fetch all folders for the user
  const fetchFolders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (!error && data) setFolders(data);
  }, [user]);

  // Create a new artifact
  const createArtifact = useCallback(async (artifactData) => {
    if (!user) return;
    const { tagIds, ...artifactWithoutTags } = artifactData;
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...artifactWithoutTags, user_id: user.id })
      .select()
      .single();
    if (error) throw error;

    // Add tags if provided
    if (tagIds?.length) {
      const tagRecords = tagIds.map((tagId) => ({
        artifact_id: data.id,
        tag_id: tagId,
      }));
      await supabase.from('artifact_tags').insert(tagRecords);
    }

    setRawArtifacts((prev) => [data, ...prev]);
    return data;
  }, [user]);

  // Update an artifact
  const updateArtifact = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('artifacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    setRawArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    if (selectedArtifact?.id === id) {
      setSelectedArtifact({ ...selectedArtifact, ...data });
    }
    return data;
  }, [selectedArtifact]);

  // Delete an artifact
  const deleteArtifact = useCallback(async (id) => {
    const { error } = await supabase.from('artifacts').delete().eq('id', id);
    if (error) throw error;

    setRawArtifacts((prev) => prev.filter((a) => a.id !== id));
    if (selectedArtifact?.id === id) {
      setSelectedArtifact(null);
    }
  }, [selectedArtifact]);

  // Create a tag
  const createTag = useCallback(async (name) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setTags((prev) => [...prev, data]);
    return data;
  }, [user]);

  // Create a folder
  const createFolder = useCallback(async (name, parentId = null) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('folders')
      .insert({ name, user_id: user.id, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    setFolders((prev) => [...prev, data]);
    return data;
  }, [user]);

  // Move an artifact to a different folder
  const moveArtifact = useCallback(async (artifactId, folderId) => {
    await supabase
      .from('artifacts')
      .update({ folder_id: folderId || null })
      .eq('id', artifactId);

    setRawArtifacts((prev) =>
      prev.map((a) => (a.id === artifactId ? { ...a, folder_id: folderId } : a))
    );
    if (selectedArtifact?.id === artifactId) {
      setSelectedArtifact((prev) => (prev ? { ...prev, folder_id: folderId } : null));
    }
  }, [user, selectedArtifact]);

  // Load all data on mount
  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchArtifacts(searchQuery, activeTag, activeFolder),
      fetchTags(),
      fetchFolders(),
    ]);
  }, [user, searchQuery, activeTag, activeFolder, fetchArtifacts, fetchTags, fetchFolders]);

  // Update tags on an artifact (syncs junction table)
  const updateArtifactTags = useCallback(async (artifactId, tagIds) => {
    if (!user) return;
    const { data: currentRelations } = await supabase
      .from('artifact_tags')
      .select('tag_id')
      .eq('artifact_id', artifactId);

    const currentTagIds = new Set((currentRelations || []).map((r) => r.tag_id));
    const newTagSet = new Set(tagIds || []);

    const toRemove = [...currentTagIds].filter((id) => !newTagSet.has(id));
    const toAdd = [...newTagSet].filter((id) => !currentTagIds.has(id));

    if (toRemove.length > 0) {
      await supabase
        .from('artifact_tags')
        .delete()
        .match({ artifact_id: artifactId, tag_id: toRemove[0] })
        .in('tag_id', toRemove);
    }

    if (toAdd.length > 0) {
      const records = toAdd.map((tagId) => ({
        artifact_id: artifactId,
        tag_id: tagId,
      }));
      await supabase.from('artifact_tags').insert(records);
    }

    await loadData();
  }, [user, loadData]);

  // Delete a tag
  const deleteTag = useCallback(async (tagId) => {
    await supabase
      .from('artifact_tags')
      .delete()
      .eq('tag_id', tagId);
    await supabase.from('tags').delete().eq('id', tagId);
    await loadData();
  }, [user, loadData]);

  // Rename a tag
  const renameTag = useCallback(async (tagId, newName) => {
    await supabase
      .from('tags')
      .update({ name: newName })
      .eq('id', tagId);
    await loadData();
  }, [user, loadData]);

  // Update tag color
  const updateTagColor = useCallback(async (tagId, color) => {
    await supabase
      .from('tags')
      .update({ color })
      .eq('id', tagId);
    setTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, color } : t)));
  }, [user]);

  // Delete a folder and its children
  const deleteFolder = useCallback(async (folderId) => {
    const getDescendants = (parentId, folders) => {
      const children = folders.filter((f) => f.parent_id === parentId);
      let ids = [parentId, ...children.map((c) => c.id)];
      children.forEach((c) => {
        ids = [...ids, ...getDescendants(c.id, folders)];
      });
      return ids;
    };

    const idsToDelete = getDescendants(folderId, folders);
    await supabase
      .from('folders')
      .delete()
      .in('id', idsToDelete);

    await supabase
      .from('artifacts')
      .update({ folder_id: null })
      .in('folder_id', idsToDelete);

    await fetchFolders();
  }, [user, folders]);

  // Rename a folder
  const renameFolder = useCallback(async (folderId, newName) => {
    await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderId);
    await fetchFolders();
  }, [user, fetchFolders]);

  // Refresh a single artifact from the database
  const refreshArtifact = useCallback(async (id) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('artifacts')
      .select('*, folder:folders(name)')
      .eq('id', id)
      .single();
    if (error) throw error;

    // Also fetch tag names and colors for this artifact
    const { data: tagData } = await supabase
      .from('artifact_tags')
      .select('tag_id')
      .eq('artifact_id', id);

    if (tagData && tagData.length > 0) {
      const { data: tagDetails } = await supabase
        .from('tags')
        .select('id, name, color')
        .in('id', tagData.map((t) => t.tag_id));

      const tagMap = {};
      if (tagDetails) {
        tagDetails.forEach((t) => { tagMap[t.id] = { name: t.name, color: t.color || '#58a6ff' }; });
      }
      data.tagNames = tagData.map((t) => tagMap[t.tag_id]).filter(Boolean);
    } else {
      data.tagNames = [];
    }

    return data;
  }, [user]);

  // Apply filters and fetch
  const applyFilters = useCallback((query, tag, folder) => {
    setSearchQuery(query || '');
    setActiveTag(tag || null);
    setActiveFolder(folder || null);
    fetchArtifacts(
      query !== undefined ? query : searchQueryRef.current,
      tag !== undefined ? tag : activeTagRef.current,
      folder !== undefined ? folder : activeFolderRef.current
    );
  }, [fetchArtifacts]);

  const value = {
    artifacts,
    tags,
    folders,
    selectedArtifact,
    setSelectedArtifact,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    activeFolder,
    setActiveFolder,
    loading,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    createTag,
    createFolder,
    updateArtifactTags,
    deleteTag,
    renameTag,
    updateTagColor,
    deleteFolder,
    renameFolder,
    moveArtifact,
    fetchArtifacts,
    applyFilters,
    loadData,
    refreshArtifact,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
