import { useAppState } from '../../context/AppStateContext';
import SearchBar from '../Search/SearchBar';

const SAVE_STATES = {
  saving: { label: 'Saving...', color: 'text-yellow-600', icon: 'M12 2v6m0 0v6m0-6h6m-6 0H6' },
  unsaved: { label: 'Unsaved changes', color: 'text-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  saved: { label: 'Saved', color: 'text-green-600', icon: 'M5 13l4 4L19 7' },
  error: { label: 'Save failed', color: 'text-red-600', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function Toolbar() {
  const {
    sidebarTab,
    setSidebarTab,
    showSettings,
    setShowSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
    saveState,
    saveError,
    lastSaveTime,
    handleQuickSave,
  } = useAppState();

  const stateInfo = SAVE_STATES[saveState] || SAVE_STATES.saved;
  const formatSaveTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 gap-2 shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
        title="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 shrink-0">NoteOrg</h1>

      {/* Folder name */}
      <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs hidden sm:inline-flex">
        {'\u{1F4C1}'} {window._folderName || 'No folder'}
      </span>

      <div className="flex-1" />

      {/* Save indicator */}
      {saveState && saveState !== 'saved' && (
        <div className={`flex items-center gap-1.5 text-xs ${stateInfo.color}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stateInfo.icon} />
          </svg>
          <span className="hidden sm:inline">{stateInfo.label}</span>
        </div>
      )}

      {lastSaveTime && saveState === 'saved' && (
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline">
          Saved {formatSaveTime(lastSaveTime)}
        </span>
      )}

      {/* Save button */}
      {saveState && saveState !== 'saved' && (
        <button
          onClick={handleQuickSave}
          className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      )}

      {/* Search */}
      <SearchBar />

      {/* Settings */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        title="Settings"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
}
