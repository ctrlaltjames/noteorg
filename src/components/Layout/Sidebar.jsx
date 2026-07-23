import { useState, useRef } from 'preact/hooks';
import { useApp } from '@context/AppContext';
import ArtifactList from './ArtifactList';

export default function Sidebar({ onOpenQuickAdd, onArtifactSelect, onEditArtifact, onDeleteArtifact }) {
  const {
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    activeFolder,
    setActiveFolder,
    tags,
    folders,
    fetchArtifacts,
    applyFilters,
  } = useApp();

  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchArtifacts(value, activeTag, activeFolder);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      fetchArtifacts(searchQuery, activeTag, activeFolder);
    }
  };

  const handleTagClick = (tagName) => {
    if (activeTag === tagName) {
      setActiveTag(null);
      fetchArtifacts(searchQuery, null, activeFolder);
    } else {
      setActiveTag(tagName);
      fetchArtifacts(searchQuery, tagName, activeFolder);
    }
  };

  const handleFolderClick = (folderId) => {
    if (activeFolder === folderId) {
      setActiveFolder(null);
      fetchArtifacts(searchQuery, activeTag, null);
    } else {
      setActiveFolder(folderId);
      fetchArtifacts(searchQuery, activeTag, folderId);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTag(null);
    setActiveFolder(null);
    fetchArtifacts('', null, null);
  };

  const hasActiveFilters = activeTag || activeFolder || searchQuery;

  return (
    <div class="w-72 bg-dark-panel border-r border-dark-border flex flex-col shrink-0">
      {/* Search */}
      <div class="p-3 border-b border-dark-border">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-secondary"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onInput={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              class="w-full pl-8 pr-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={onOpenQuickAdd}
            class="bg-primary-dark hover:bg-primary-dark/80 text-white px-3 py-1.5 rounded text-sm transition-colors shrink-0"
            title="Quick Add"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Filter toggle */}
        <div
          onClick={() => setShowFilters(!showFilters)}
          class={`mt-2 flex items-center gap-1.5 text-xs text-dark-secondary hover:text-dark-text transition-colors cursor-pointer w-full ${
            hasActiveFilters ? 'text-accent-dark' : ''
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class={`transition-transform ${showFilters ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Tags & Folders
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              class="ml-auto text-danger-dark hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter panels */}
        {showFilters && (
          <div class="mt-2 space-y-3">
            {/* Tags */}
            <div>
              <h4 class="text-xs font-medium text-dark-secondary mb-1.5 uppercase tracking-wider">Tags</h4>
              {tags.length === 0 ? (
                <p class="text-xs text-dark-secondary">No tags yet</p>
              ) : (
                <div class="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.name)}
                      class={`text-xs px-2 py-1 rounded transition-colors ${
                        activeTag === tag.name
                          ? 'bg-accent-dark/20 text-accent-dark'
                          : 'bg-dark-border/30 text-dark-secondary hover:bg-dark-border/50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Folders */}
            <div>
              <h4 class="text-xs font-medium text-dark-secondary mb-1.5 uppercase tracking-wider">Folders</h4>
              {folders.length === 0 ? (
                <p class="text-xs text-dark-secondary">No folders yet</p>
              ) : (
                <div class="space-y-0.5">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder.id)}
                      class={`flex items-center gap-1.5 text-xs w-full text-left px-2 py-1 rounded transition-colors ${
                        activeFolder === folder.id
                          ? 'bg-accent-dark/20 text-accent-dark'
                          : 'text-dark-secondary hover:bg-dark-border/30'
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      {folder.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Artifact list */}
      <div class="flex-1 overflow-hidden">
        <ArtifactList
          onArtifactSelect={onArtifactSelect}
          onEditArtifact={onEditArtifact}
          onDeleteArtifact={onDeleteArtifact}
        />
      </div>
    </div>
  );
}
