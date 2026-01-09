import type { ElementNode } from '@wirescript/dsl';
import { createContext, type ReactNode, useContext } from 'react';

interface AutoActiveContextValue {
  currentScreenId: string | null;
}

export const AutoActiveContext = createContext<AutoActiveContextValue>({
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

export function useAutoActive() {
  return useContext(AutoActiveContext);
}

/**
 * Hook to determine if an element should be auto-active.
 * Returns true if the element has a :to prop that matches the current screen.
 *
 * Auto-active does NOT apply to:
 * - Overlay references (starting with #)
 * - Action keywords (starting with :)
 */
export function useIsAutoActive(element: ElementNode): boolean {
  const { currentScreenId } = useAutoActive();
  const toTarget = element.props.to;

  if (!toTarget) return false;
  if (!currentScreenId) return false;

  // Handle structured format from DSL type casting (e.g., { type: 'screen', id: 'contacts' })
  if (typeof toTarget === 'object' && toTarget !== null && 'type' in toTarget) {
    const ref = toTarget as { type: string; id?: string };
    if (ref.type === 'screen' && ref.id) {
      return ref.id === currentScreenId;
    }
    return false; // overlay or action refs don't auto-activate
  }

  // Handle legacy string format
  if (typeof toTarget !== 'string') return false;
  if (toTarget.startsWith('#')) return false; // overlay reference
  if (toTarget.startsWith(':')) return false; // action keyword

  return toTarget === currentScreenId;
}
