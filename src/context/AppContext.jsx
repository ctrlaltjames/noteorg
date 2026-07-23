import { createContext } from 'preact';
import { useState, useCallback, useContext, useEffect } from 'preact/hooks';
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
      }));

      if (artifactList.length > 0) {
        const artifactIds = artifactList.map((a) => a.id);
        const { data: tagData } = await supabase
          .from('artifact_tags')
          .select('artifact_id, tag_id')
          .in('artifact_id', artifactIds);

        const { data: tagDetails } = await supabase
          .from('tags')
          .select('id, name')
          .in('id', tagData ? tagData.map((t) => t.tag_id) : []);

        const tagMap = {};
        if (tagDetails) {
          tagDetails.forEach((t) => {
            if (!tagMap[t.id]) tagMap[t.id] = t.name;
          });
        }

        artifactList = artifactList.map((a) => {
          const artifactTags = tagData ? tagData.filter((t) => t.artifact_id === a.id) : [];
          a.tagNames = artifactTags.map((t) => tagMap[t.tag_id] || '').filter(Boolean);
          return a;
        });
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
            const tagMatch = a.tagNames.some((t) => t.toLowerCase().includes(q));
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
        artifactList = artifactList.filter((a) => a.tagNames.includes(tag));
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

  // Load all data on mount
  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchArtifacts(searchQuery, activeTag, activeFolder),
      fetchTags(),
      fetchFolders(),
    ]);
  }, [user, searchQuery, activeTag, activeFolder, fetchArtifacts, fetchTags, fetchFolders]);

  // Refresh a single artifact from the database
  const refreshArtifact = useCallback(async (id) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('artifacts')
      .select('*, folder:folders(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }, [user]);

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
