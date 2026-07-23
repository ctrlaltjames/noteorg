import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';

const FileSystemContext = createContext(null);

const TOAST_TYPES = {
  success: { color: 'bg-green-600', icon: 'M5 13l4 4L19 7' },
  error: { color: 'bg-red-600', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  info: { color: 'bg-blue-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const LAST_FOLDER_KEY = 'lastFolderName';

export function FileSystemProvider({ children }) {
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [handleCache, setHandleCache] = useState(new Map());
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastFolderName, setLastFolderName] = useState(() => {
    try {
      return localStorage.getItem(LAST_FOLDER_KEY) || '';
    } catch {
      return '';
    }
  });

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const getHandle = useCallback(async (parent, name) => {
    const cacheKey = `${parent?.name || 'root'}/${name}`;
    if (handleCache.has(cacheKey)) {
      return handleCache.get(cacheKey);
    }
    return null;
  }, [handleCache]);

  const openDirectory = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      addToast('File System Access API is not available in this browser.', 'error');
      throw new Error('File System Access API is not available in this browser.');
    }
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setHandleCache(new Map([[handle.name, handle]]));
      window._folderName = handle.name;
      setLastFolderName(handle.name);
      try {
        localStorage.setItem(LAST_FOLDER_KEY, handle.name);
      } catch {}
      addToast(`Opened folder: ${handle.name}`, 'success');
      return handle;
    } catch (err) {
      if (err.name !== 'AbortError') {
        addToast(`Failed to open folder: ${err.message}`, 'error');
      }
      throw err;
    }
  }, [addToast]);

  const readFile = useCallback(async (path) => {
    if (!directoryHandle) return null;
    try {
      const parts = path.split('/').filter(Boolean);
      let current = directoryHandle;

      for (let i = 0; i < parts.length - 1; i++) {
        const dirHandle = await current.getDirectoryHandle(parts[i]);
        current = dirHandle;
      }

      const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (err) {
      addToast(`Failed to read "${path}": ${err.message}`, 'error');
      return null;
    }
  }, [directoryHandle, addToast]);

  const writeFile = useCallback(async (path, content) => {
    if (!directoryHandle) return false;
    try {
      const parts = path.split('/').filter(Boolean);
      let current = directoryHandle;

      for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        try {
          current = await current.getDirectoryHandle(dirName, { create: true });
        } catch (e) {
          current = await current.getDirectoryHandle(dirName);
        }
      }

      const fileName = parts[parts.length - 1];
      const fileHandle = await current.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      triggerRefresh();
      return true;
    } catch (err) {
      addToast(`Failed to write "${path}": ${err.message}`, 'error');
      return false;
    }
  }, [directoryHandle, addToast, triggerRefresh]);

  const createDirectory = useCallback(async (path) => {
    if (!directoryHandle) return false;
    try {
      const parts = path.split('/').filter(Boolean);
      let current = directoryHandle;

      for (const part of parts) {
        try {
          current = await current.getDirectoryHandle(part, { create: true });
        } catch (e) {
          current = await current.getDirectoryHandle(part);
        }
      }
      triggerRefresh();
      return true;
    } catch (err) {
      addToast(`Failed to create directory "${path}": ${err.message}`, 'error');
      return false;
    }
  }, [directoryHandle, addToast, triggerRefresh]);

  const listDirectory = useCallback(async (path) => {
    if (!directoryHandle) return [];
    let current = directoryHandle;

    if (path) {
      const parts = path.split('/').filter(Boolean);
      for (const part of parts) {
        try {
          current = await current.getDirectoryHandle(part);
        } catch (e) {
          return [];
        }
      }
    }

    const items = [];
    try {
      for await (const entry of current.values()) {
        items.push({
          name: entry.name,
          kind: entry.kind,
          path: path ? `${path}/${entry.name}` : entry.name,
        });
      }
    } catch (e) {
      return [];
    }

    return items.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
  }, [directoryHandle]);

  const getFileHandle = useCallback(async (path) => {
    if (!directoryHandle) return null;
    const parts = path.split('/').filter(Boolean);
    let current = directoryHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        current = await current.getDirectoryHandle(parts[i]);
      } catch (e) {
        return null;
      }
    }

    try {
      return await current.getFileHandle(parts[parts.length - 1]);
    } catch (e) {
      return null;
    }
  }, [directoryHandle]);

  const deleteFile = useCallback(async (path) => {
    if (!directoryHandle) return false;
    try {
      const parts = path.split('/').filter(Boolean);
      let current = directoryHandle;

      for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i]);
      }

      await current.removeEntry(parts[parts.length - 1]);
      triggerRefresh();
      return true;
    } catch (err) {
      addToast(`Failed to delete "${path}": ${err.message}`, 'error');
      return false;
    }
  }, [directoryHandle, addToast, triggerRefresh]);

  const getValue = useCallback(() => {
    return {
      directoryHandle,
      toasts,
      lastFolderName,
      refreshKey,
      openDirectory,
      readFile,
      writeFile,
      createDirectory,
      deleteFile,
      listDirectory,
      getFileHandle,
    };
  }, [directoryHandle, toasts, lastFolderName, refreshKey, openDirectory, readFile, writeFile, createDirectory, deleteFile, listDirectory, getFileHandle]);

  return (
    <FileSystemContext.Provider value={getValue()}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[2000] space-y-2" aria-live="polite">
        {toasts.map((toast) => {
          const style = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
          return (
            <div
              key={toast.id}
              className={`${style.color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[250px] max-w-[400px] animate-slideUp`}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
              </svg>
              <span className="text-sm flex-1">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}
