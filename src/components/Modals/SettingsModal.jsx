import { useState, useCallback } from 'preact/hooks';
import { useAppState } from '../../context/AppStateContext';

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 14,
  autoSaveInterval: 2000,
  wordWrap: true,
  showLineNumbers: true,
  tabSize: 2,
};

export default function SettingsModal() {
  const { settings, updateSettings, showSettings, setShowSettings } = useAppState();
  const [localSettings, setLocalSettings] = useState({ ...settings, ...DEFAULT_SETTINGS });

  const handleChange = useCallback((key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    updateSettings(localSettings);
    setShowSettings(false);
  }, [localSettings, updateSettings, setShowSettings]);

  const handleReset = useCallback(() => {
    setLocalSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(localSettings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noteorg-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [localSettings]);

  if (!showSettings) return null;

  return (
    <div className="modal-overlay dark:bg-black/70" onClick={() => setShowSettings(false)}>
      <div className="modal-content w-full max-w-lg mx-4 bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-96 overflow-y-auto">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Theme</label>
            <select
              value={localSettings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700"
            >
              <option value="light" className="text-gray-900">Light</option>
              <option value="dark" className="text-gray-900">Dark</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Font Size: {localSettings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={localSettings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Auto-save Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Auto-save Interval: {localSettings.autoSaveInterval}ms
            </label>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={localSettings.autoSaveInterval}
              onChange={(e) => handleChange('autoSaveInterval', parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Tab Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tab Size: {localSettings.tabSize}</label>
            <select
              value={localSettings.tabSize}
              onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700"
            >
              <option value={2} className="text-gray-900">2 spaces</option>
              <option value={4} className="text-gray-900">4 spaces</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Word Wrap</span>
              <input
                type="checkbox"
                checked={localSettings.wordWrap}
                onChange={(e) => handleChange('wordWrap', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Line Numbers</span>
              <input
                type="checkbox"
                checked={localSettings.showLineNumbers}
                onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Export
            </button>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
