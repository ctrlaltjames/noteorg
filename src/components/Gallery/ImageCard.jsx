import { useState, useEffect, useRef } from 'preact/hooks';
import { useFileSystem } from '../../context/FileSystemContext';

export default function ImageCard({ image, onSelect }) {
  const { readFile } = useFileSystem();
  const [dataUrl, setDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const buffer = await readFile(image.path);
        if (cancelled) return;
        if (buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer.constructor)) {
          const blob = new Blob([buffer]);
          const url = URL.createObjectURL(blob);
          setDataUrl(url);
        } else {
          const blob = new Blob([buffer]);
          const url = URL.createObjectURL(blob);
          setDataUrl(url);
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (dataUrl && dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(dataUrl);
      }
    };
  }, [image.path, readFile]);

  const handleClick = () => {
    if (onSelect) onSelect(image);
  };

  return (
    <div
      className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {loading ? (
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <img
            ref={imgRef}
            src={dataUrl || ''}
            alt={image.name}
            className="w-full h-full object-cover"
            onLoad={() => setLoading(false)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-black bg-opacity-50 rounded">
              {image.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
