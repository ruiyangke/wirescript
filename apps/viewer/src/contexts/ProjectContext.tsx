import { createContext, type ReactNode, useContext } from 'react';
import { type ProjectFolderState, useProjectFolder } from '../hooks/useProjectFolder';

const ProjectContext = createContext<ProjectFolderState | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const projectFolder = useProjectFolder();

  return <ProjectContext.Provider value={projectFolder}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectFolderState {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
