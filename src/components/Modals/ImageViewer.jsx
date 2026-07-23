import { useEffect, useCallback } from 'preact/hooks';
import { useAppState } from '../../context/AppStateContext';

export default function ImageViewer() {
  const { imageViewer, setImageViewer } = useAppState();
  const { show, src, alt } = imageViewer || {};

  const handleClose = useCallback(() => {
    setImageViewer({ show: false });
  }, [setImageViewer]);

  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, handleClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="relative max-w-screen-w max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={src}
          alt={alt || 'Viewed image'}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Caption */}
        {alt && (
          <p className="text-center text-sm text-gray-500 mt-3">{alt}</p>
        )}
      </div>
    </div>
  );
}
