import { getPreview } from '@utils/markdown';

export default function ArtifactCard({ artifact, isSelected, onClick, onEdit, onDelete }) {
  const isNote = artifact.type === 'note';
  const folderName = artifact.folder?.name || '';

  return (
    <div
      onClick={onClick}
      class={`group relative p-3 border-b theme-border cursor-pointer transition-colors ${
        isSelected
          ? 'theme-bg-panel border-l-2 border-l-[var(--text-accent)]'
          : 'hover:theme-bg-border/30 border-l-2 border-l-transparent'
      }`}
    >
      {/* Hover actions bar */}
      <div class="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            class="p-1.5 rounded transition-colors theme-text-secondary hover:theme-text-accent hover:bg-[var(--border-color)]/20"
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            class="p-1.5 rounded transition-colors theme-text-secondary hover:theme-text-danger hover:bg-[var(--border-color)]/20"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      <div class="flex items-start gap-3">
        {/* Type icon */}
        <div class={`mt-0.5 shrink-0 ${isNote ? 'text-accent-dark' : 'text-primary-dark'}`}>
          {isNote ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium theme-text truncate">
            {isNote ? artifact.title : (artifact.title || 'Image')}
          </h3>

          <p class="text-xs theme-text-secondary mt-1 line-clamp-2">
            {isNote ? getPreview(artifact.content) : 'Image'}
          </p>

          {/* Tags */}
          {artifact.tagNames?.length > 0 && (
            <div class="flex flex-wrap gap-1 mt-2">
              {artifact.tagNames.slice(0, 3).map((tag) => (
                <span key={tag} class="text-xs theme-bg-border/30 theme-text-secondary px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {artifact.tagNames.length > 3 && (
                <span class="text-xs theme-text-secondary">+{artifact.tagNames.length - 3}</span>
              )}
            </div>
          )}

          {/* Folder & date */}
          <div class="flex items-center gap-2 mt-1.5 text-xs theme-text-secondary">
            {folderName && (
              <span class="flex items-center gap-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {folderName}
              </span>
            )}
            <span>{new Date(artifact.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
