import { createContext, type ReactNode, useContext } from 'react';
import { type OpenFilesState, useOpenFiles } from '../hooks/useOpenFiles';

const FilesContext = createContext<OpenFilesState | null>(null);

export function FilesProvider({ children }: { children: ReactNode }) {
  const openFiles = useOpenFiles();

  return <FilesContext.Provider value={openFiles}>{children}</FilesContext.Provider>;
}

export function useFiles(): OpenFilesState {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
}
