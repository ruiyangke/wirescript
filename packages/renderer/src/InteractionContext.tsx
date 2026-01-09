import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

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
  onScreenChange?: (screenId: string) => void;
}

/** Navigation action type for SSR */
export type NavigateAction = (to: string) => void;

export const InteractionContext = createContext<InteractionContextValue | null>(null);

interface InteractionProviderProps {
  children: ReactNode;
  initialScreen?: string;
  onScreenChange?: (screenId: string) => void;
}

export function InteractionProvider({
  children,
  initialScreen,
  onScreenChange,
}: InteractionProviderProps) {
  const [state, setState] = useState<InteractionState>({
    openOverlays: new Set(),
    currentScreen: initialScreen || null,
  });

  // Sync currentScreen when initialScreen prop changes (e.g., from external dropdown)
  useEffect(() => {
    if (initialScreen && initialScreen !== state.currentScreen) {
      setState((prev) => ({
        ...prev,
        currentScreen: initialScreen,
        openOverlays: new Set(), // Close overlays on external navigation
      }));
    }
  }, [initialScreen]);

  const openOverlay = useCallback((id: string) => {
    setState((prev) => {
      // Skip if already open
      if (prev.openOverlays.has(id)) return prev;
      // Create new Set with added item
      const newOverlays = new Set(prev.openOverlays);
      newOverlays.add(id);
      return { ...prev, openOverlays: newOverlays };
    });
  }, []);

  const closeOverlay = useCallback((id: string) => {
    setState((prev) => {
      // Skip if not open
      if (!prev.openOverlays.has(id)) return prev;
      // Create new Set without the item
      const newOverlays = new Set(prev.openOverlays);
      newOverlays.delete(id);
      return { ...prev, openOverlays: newOverlays };
    });
  }, []);

  const closeAllOverlays = useCallback(() => {
    setState((prev) => {
      // Skip if already empty
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
      setState((prev) => ({
        ...prev,
        currentScreen: screenId,
        openOverlays: new Set(), // Close overlays on navigation
      }));
      onScreenChange?.(screenId);
    },
    [onScreenChange]
  );

  const handleAction = useCallback(
    (to: string | undefined) => {
      if (!to) return;

      // Handle action keywords
      if (to === ':close' || to === 'close') {
        // Close the most recently opened overlay
        const overlays = Array.from(state.openOverlays);
        if (overlays.length > 0) {
          closeOverlay(overlays[overlays.length - 1]);
        }
        return;
      }

      if (to === ':back' || to === 'back') {
        // Could implement history, for now just close overlays
        closeAllOverlays();
        return;
      }

      if (to === ':submit' || to === 'submit') {
        // Form submit - close overlays for now
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
    onScreenChange,
  };

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useInteraction(): InteractionContextValue {
  const context = useContext(InteractionContext);
  if (!context) {
    // Return a no-op context for non-interactive rendering
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
