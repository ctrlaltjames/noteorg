import { useState, useCallback, useRef } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';
import ImageCard from './ImageCard';

export default function ImageGallery({ images, selectedPath, onSelect }) {
  const { listDirectory, readFile, writeFile } = useFileSystem();
  const [galleryImages, setGalleryImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadImagePaths = useCallback(async () => {
    if (!selectedPath) return;
    const parts = selectedPath.split('/').filter(Boolean);
    const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

    try {
      const items = await listDirectory(dirPath);
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
      const images = items
        .filter((item) => {
          if (item.kind !== 'file') return false;
          const ext = '.' + item.name.split('.').pop().toLowerCase();
          return imageExts.includes(ext);
        })
        .map((item) => ({
          path: item.path,
          name: item.name,
        }));
      setGalleryImages(images);
    } catch (e) {
      // ignore
    }
  }, [selectedPath, listDirectory]);

  const handlePaste = useCallback(
    async (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const buffer = await file.arrayBuffer();
          const timestamp = Date.now();
          const fileName = `pasted-${timestamp}.${file.type.split('/')[1] || 'png'}`;
          const dirPath = selectedPath
            ? selectedPath.split('/').slice(0, -1).join('/')
            : '';
          try {
            await writeFile(`${dirPath}/${fileName}`, buffer);
            await loadImagePaths();
          } catch (err) {
            // ignore
          }
          break;
        }
      }
    },
    [selectedPath, writeFile, loadImagePaths]
  );

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setDragOver(false);
      const dirPath = selectedPath
        ? selectedPath.split('/').slice(0, -1).join('/')
        : '';

      for (const file of e.dataTransfer.files) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const buffer = await file.arrayBuffer();
          await writeFile(`${dirPath}/${file.name}`, buffer);
        } catch (err) {
          // ignore
        }
      }
      await loadImagePaths();
    },
    [selectedPath, writeFile, loadImagePaths]
  );

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files?.length) return;
      const dirPath = selectedPath
        ? selectedPath.split('/').slice(0, -1).join('/')
        : '';

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const buffer = await file.arrayBuffer();
          await writeFile(`${dirPath}/${file.name}`, buffer);
        } catch (err) {
          // ignore
        }
      }
      await loadImagePaths();
      e.target.value = '';
    },
    [selectedPath, writeFile, loadImagePaths]
  );

  return (
    <div
      className="h-full flex flex-col"
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
        <span className="text-xs font-medium text-gray-500">Images</span>
        <div className="flex-1" />
        <button
          onClick={handleBrowse}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Browse
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {dragOver && (
          <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center mb-4">
            <p className="text-blue-600 font-medium">Drop images here</p>
          </div>
        )}

        {galleryImages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="text-gray-500 text-sm mb-2">No images in this folder</p>
            <p className="text-gray-400 text-xs">
              Paste images with Ctrl+V or click Browse to add images
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.map((img) => (
              <ImageCard key={img.path} image={img} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
