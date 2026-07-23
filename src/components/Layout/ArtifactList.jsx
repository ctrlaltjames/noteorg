import { useApp } from '@context/AppContext';
import ArtifactCard from './ArtifactCard';

export default function ArtifactList({ onArtifactSelect, onEditArtifact, onDeleteArtifact }) {
  const { artifacts, loading, searchQuery, activeTag, activeFolder } = useApp();

  if (loading) {
    return (
      <div class="flex items-center justify-center h-full text-dark-secondary">
        <div class="text-center">
          <div class="animate-spin mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <p class="text-sm">Loading artifacts...</p>
        </div>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div class="flex items-center justify-center h-full text-dark-secondary">
        <div class="text-center p-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-3 text-dark-border">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p class="text-sm font-medium mb-1">No artifacts found</p>
          <p class="text-xs text-dark-secondary">
            {searchQuery || activeTag || activeFolder
              ? 'Try adjusting your filters'
              : 'Click "New" to create your first artifact'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="h-full overflow-y-auto">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          isSelected={false}
          onClick={() => onArtifactSelect(artifact)}
          onEdit={onEditArtifact ? () => onEditArtifact(artifact) : undefined}
          onDelete={onDeleteArtifact ? () => onDeleteArtifact(artifact) : undefined}
        />
      ))}
    </div>
  );
}
