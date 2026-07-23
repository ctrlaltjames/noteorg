import { createContext, useContext, useState, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children, user }) {
  const [artifacts, setArtifacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all artifacts with optional filters
  const fetchArtifacts = useCallback(async (query, tag, folder) => {
    if (!user) return;
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('artifacts')
        .select('*, folder:folders(name), tags:artifact_tags(tag_id), tag_details:artifact_tags(tag_id, tags(name))')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`).or(`content.ilike.%${query}%`);
      }

      if (tag) {
        queryBuilder = queryBuilder.eq('tag_details.tags.name', tag);
      }

      if (folder) {
        queryBuilder = queryBuilder.eq('folder_id', folder);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      // Flatten the nested tag data
      const flatArtifacts = (data || []).map((item) => ({
        ...item,
        tagNames: (item.tag_details || []).map((t) => t.tags?.name || t.tag_details?.name).filter(Boolean),
      }));

      setArtifacts(flatArtifacts);
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
    if (!error && data) setTags(data);
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
    const { data, error } = await supabase
      .from('artifacts')
      .insert({ ...artifactData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;

    // Add tags if provided
    if (artifactData.tagIds?.length) {
      const tagRecords = artifactData.tagIds.map((tagId) => ({
        artifact_id: data.id,
        tag_id: tagId,
      }));
      await supabase.from('artifact_tags').insert(tagRecords);
    }

    setArtifacts((prev) => [data, ...prev]);
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

    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    if (selectedArtifact?.id === id) {
      setSelectedArtifact({ ...selectedArtifact, ...data });
    }
    return data;
  }, [selectedArtifact]);

  // Delete an artifact
  const deleteArtifact = useCallback(async (id) => {
    const { error } = await supabase.from('artifacts').delete().eq('id', id);
    if (error) throw error;

    setArtifacts((prev) => prev.filter((a) => a.id !== id));
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

  // Load all data on mount
  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchArtifacts(searchQuery, activeTag, activeFolder),
      fetchTags(),
      fetchFolders(),
    ]);
  }, [user, searchQuery, activeTag, activeFolder, fetchArtifacts, fetchTags, fetchFolders]);

  // Apply filters and fetch
  const applyFilters = useCallback((query, tag, folder) => {
    setSearchQuery(query || '');
    setActiveTag(tag || null);
    setActiveFolder(folder || null);
    fetchArtifacts(query || searchQuery, tag || activeTag, folder || activeFolder);
  }, [searchQuery, activeTag, activeFolder, fetchArtifacts]);

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
    fetchArtifacts,
    applyFilters,
    loadData,
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
