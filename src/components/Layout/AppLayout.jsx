import { useFileSystem } from '../../context/FileSystemContext';

export default function AppLayout() {
  const { directoryHandle } = useFileSystem();

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">NoteOrg</h1>
        {directoryHandle && (
          <span className="ml-4 text-sm text-gray-500 truncate max-w-md">
            📁 {directoryHandle.name}
          </span>
        )}
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Explorer
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-sm text-gray-400 text-center mt-8">
              {directoryHandle ? 'No items yet' : 'Select a folder to begin'}
            </p>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 bg-white overflow-hidden">
          {!directoryHandle ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to NoteOrg
                </h2>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Select a folder on your machine to start organizing your notes, images, and code snippets.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">📂</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {directoryHandle.name}
                </h2>
                <p className="text-gray-500">
                  Start creating notes or browsing your folder.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
