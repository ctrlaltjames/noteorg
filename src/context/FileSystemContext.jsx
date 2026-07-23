import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';

const FileSystemContext = createContext(null);

export function FileSystemProvider({ children }) {
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [handleCache, setHandleCache] = useState(new Map());

  const getHandle = useCallback(async (parent, name) => {
    const cacheKey = `${parent?.name || 'root'}/${name}`;
    if (handleCache.has(cacheKey)) {
      return handleCache.get(cacheKey);
    }
    return null;
  }, [handleCache]);

  const openDirectory = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not available in this browser.');
    }
    const handle = await window.showDirectoryPicker();
    setDirectoryHandle(handle);
    setHandleCache(new Map([[handle.name, handle]]));
    return handle;
  }, []);

  const readFile = useCallback(async (path) => {
    if (!directoryHandle) return null;
    const parts = path.split('/').filter(Boolean);
    let current = directoryHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirHandle = await current.getDirectoryHandle(parts[i]);
      current = dirHandle;
    }

    const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    return await file.text();
  }, [directoryHandle]);

  const writeFile = useCallback(async (path, content) => {
    if (!directoryHandle) return false;
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
    return true;
  }, [directoryHandle]);

  const createDirectory = useCallback(async (path) => {
    if (!directoryHandle) return false;
    const parts = path.split('/').filter(Boolean);
    let current = directoryHandle;

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part, { create: true });
      } catch (e) {
        current = await current.getDirectoryHandle(part);
      }
    }
    return true;
  }, [directoryHandle]);

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

  const getValue = useCallback(() => {
    return {
      directoryHandle,
      openDirectory,
      readFile,
      writeFile,
      createDirectory,
      listDirectory,
      getFileHandle,
    };
  }, [directoryHandle, openDirectory, readFile, writeFile, createDirectory, listDirectory, getFileHandle]);

  return (
    <FileSystemContext.Provider value={getValue()}>
      {children}
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
