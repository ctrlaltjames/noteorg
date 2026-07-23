import { FileSystemProvider } from './context/FileSystemContext';
import AppLayout from './components/Layout/AppLayout';

export default function App() {
  return (
    <FileSystemProvider>
      <AppLayout />
    </FileSystemProvider>
  );
}
