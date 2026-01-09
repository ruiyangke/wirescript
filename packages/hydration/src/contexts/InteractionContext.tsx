/**
 * Client-side InteractionContext for hydrated islands
 *
 * Handles navigation via location.href for static site navigation
 * and manages overlay state for interactive prototypes.
 */

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

interface InteractionState {
  openOverlays: Set<string>;
  currentScreen: string | null;
}

interface InteractionContextValue {
  state: InteractionState;
  openOverlay: (id: string) => void;
  closeOverlay: (id: string) => void;
  closeAllOverlays: () => void;
  isOverlayOpen: (id: string) => boolean;
  navigateTo: (screenId: string) => void;
  handleAction: (to: string | undefined) => void;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

interface InteractionProviderProps {
  children: ReactNode;
  initialScreen?: string;
  /** Map of screen IDs to their HTML file paths (e.g., { "dashboard": "dashboard.html" }) */
  screenUrls?: Record<string, string>;
}

/**
 * Client-side InteractionProvider for hydrated pages
 *
 * Navigation uses location.href to navigate between static HTML pages.
 * Overlays are managed with React state.
 */
export function InteractionProvider({
  children,
  initialScreen,
  screenUrls = {},
}: InteractionProviderProps) {
  const [state, setState] = useState<InteractionState>({
    openOverlays: new Set(),
    currentScreen: initialScreen || null,
  });

  const openOverlay = useCallback((id: string) => {
    setState((prev) => {
      if (prev.openOverlays.has(id)) return prev;
      const newOverlays = new Set(prev.openOverlays);
      newOverlays.add(id);
      return { ...prev, openOverlays: newOverlays };
    });
  }, []);

  const closeOverlay = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.openOverlays.has(id)) return prev;
      const newOverlays = new Set(prev.openOverlays);
      newOverlays.delete(id);
      return { ...prev, openOverlays: newOverlays };
    });
  }, []);

  const closeAllOverlays = useCallback(() => {
    setState((prev) => {
      if (prev.openOverlays.size === 0) return prev;
      return { ...prev, openOverlays: new Set() };
    });
  }, []);

  const isOverlayOpen = useCallback(
    (id: string) => state.openOverlays.has(id),
    [state.openOverlays]
  );

  const navigateTo = useCallback(
    (screenId: string) => {
      // Navigate to the static HTML file
      const url = screenUrls[screenId] || `${screenId}.html`;
      window.location.href = url;
    },
    [screenUrls]
  );

  const handleAction = useCallback(
    (to: string | undefined) => {
      if (!to) return;

      // Handle action keywords
      if (to === ':close' || to === 'close') {
        const overlays = Array.from(state.openOverlays);
        if (overlays.length > 0) {
          closeOverlay(overlays[overlays.length - 1]);
        }
        return;
      }

      if (to === ':back' || to === 'back') {
        // Use browser history for back navigation
        if (state.openOverlays.size > 0) {
          closeAllOverlays();
        } else {
          window.history.back();
        }
        return;
      }

      if (to === ':submit' || to === 'submit') {
        closeAllOverlays();
        return;
      }

      // Handle overlay references (start with #)
      if (to.startsWith('#')) {
        const overlayId = to.slice(1);
        openOverlay(overlayId);
        return;
      }

      // Handle screen navigation
      navigateTo(to);
    },
    [state.openOverlays, openOverlay, closeOverlay, closeAllOverlays, navigateTo]
  );

  const value: InteractionContextValue = {
    state,
    openOverlay,
    closeOverlay,
    closeAllOverlays,
    isOverlayOpen,
    navigateTo,
    handleAction,
  };

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useInteraction(): InteractionContextValue {
  const context = useContext(InteractionContext);
  if (!context) {
    // Return a no-op context for non-hydrated elements
    return {
      state: { openOverlays: new Set(), currentScreen: null },
      openOverlay: () => {},
      closeOverlay: () => {},
      closeAllOverlays: () => {},
      isOverlayOpen: () => false,
      navigateTo: () => {},
      handleAction: () => {},
    };
  }
  return context;
}
