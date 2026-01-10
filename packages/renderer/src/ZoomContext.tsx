import * as React from 'react';

/**
 * Context for providing zoom level to Radix UI portal components.
 * When content is rendered inside a transform: scale() container, popovers/dropdowns
 * that portal to document.body need to match the visual size of their trigger.
 *
 * The main content uses transform: scale() for zooming (predictable coordinate behavior),
 * while portal content uses CSS zoom to match the scaled appearance.
 */
const ZoomContext = React.createContext<number>(1);

interface ZoomProviderProps {
  children: React.ReactNode;
  zoom: number;
}

/**
 * Provider for zoom level.
 * Wrap your zoomed content with this provider and pass the zoom level (e.g., 0.75 for 75%).
 */
export function ZoomProvider({ children, zoom }: ZoomProviderProps) {
  return <ZoomContext.Provider value={zoom}>{children}</ZoomContext.Provider>;
}

/**
 * Hook to get the current zoom level.
 * Returns 1 (no zoom) if no ZoomProvider is set up.
 */
export function useZoom(): number {
  return React.useContext(ZoomContext);
}
