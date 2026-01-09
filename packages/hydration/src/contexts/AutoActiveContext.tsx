/**
 * AutoActiveContext for hydrated islands
 *
 * Tracks the current screen to highlight active navigation items.
 */

import { createContext, type ReactNode, useContext } from 'react';

interface AutoActiveContextValue {
  currentScreenId: string | null;
}

const AutoActiveContext = createContext<AutoActiveContextValue>({
  currentScreenId: null,
});

interface AutoActiveProviderProps {
  screenId: string;
  children: ReactNode;
}

export function AutoActiveProvider({ screenId, children }: AutoActiveProviderProps) {
  return (
    <AutoActiveContext.Provider value={{ currentScreenId: screenId }}>
      {children}
    </AutoActiveContext.Provider>
  );
}

export function useAutoActive(): AutoActiveContextValue {
  return useContext(AutoActiveContext);
}

/**
 * Check if a navigation target matches the current screen.
 * Returns true if the target should be shown as "active".
 *
 * Auto-active does NOT apply to:
 * - Overlay references (starting with #)
 * - Action keywords (starting with :)
 */
export function isAutoActive(to: string | undefined, currentScreenId: string | null): boolean {
  if (!to || typeof to !== 'string') return false;
  if (!currentScreenId) return false;
  if (to.startsWith('#')) return false; // overlay reference
  if (to.startsWith(':')) return false; // action keyword

  return to === currentScreenId;
}
