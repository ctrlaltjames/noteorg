import { FileSystemProvider } from './context/FileSystemContext';
import { AppStateProvider } from './context/AppStateContext';
import AppLayout from './components/Layout/AppLayout';

export default function App() {
  return (
    <FileSystemProvider>
      <AppStateProvider>
        <AppLayout />
      </AppStateProvider>
    </FileSystemProvider>
  );
}
