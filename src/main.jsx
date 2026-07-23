import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import App from './App.jsx';
import './styles/tailwind.css';
import './styles/custom.css';

function Main() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiAvailable = 'showDirectoryPicker' in window;
    if (!apiAvailable) {
      setError(
        'Your browser does not support the File System Access API. ' +
          'Please use Chrome, Edge, or Arc for the best experience. ' +
          'Some features may not work in other browsers.'
      );
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Browser Not Supported</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            NoteOrg uses the File System Access API for direct file access.
          </p>
        </div>
      </div>
    );
  }

  return <App />;
}

const root = document.getElementById('root');
render(<Main />, root);
