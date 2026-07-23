import { getPreview } from '../../utils/markdown';

export default function ArtifactCard({ artifact, isSelected, onClick }) {
  const isNote = artifact.type === 'note';
  const folderName = artifact.folder?.name || '';

  return (
    <div
      onClick={onClick}
      class={`p-3 border-b border-dark-border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-dark-panel border-l-2 border-l-accent-dark'
          : 'hover:bg-dark-border/30 border-l-2 border-l-transparent'
      }`}
    >
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
          <h3 class="text-sm font-medium text-dark-text truncate">
            {isNote ? artifact.title : (artifact.title || 'Image')}
          </h3>

          <p class="text-xs text-dark-secondary mt-1 line-clamp-2">
            {isNote ? getPreview(artifact.content) : 'Image'}
          </p>

          {/* Tags */}
          {artifact.tagNames?.length > 0 && (
            <div class="flex flex-wrap gap-1 mt-2">
              {artifact.tagNames.slice(0, 3).map((tag) => (
                <span key={tag} class="text-xs bg-dark-border/30 text-dark-secondary px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {artifact.tagNames.length > 3 && (
                <span class="text-xs text-dark-secondary">+{artifact.tagNames.length - 3}</span>
              )}
            </div>
          )}

          {/* Folder & date */}
          <div class="flex items-center gap-2 mt-1.5 text-xs text-dark-secondary">
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
