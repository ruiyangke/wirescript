import type {
  ElementNode,
  OverlayNode,
  RepeatNode,
  ScreenNode,
  WireDocument,
} from '@wirescript/dsl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AutoActiveProvider } from './AutoActiveContext.js';
import { ComponentsProvider } from './ComponentsContext.js';
import { ElementRenderer } from './ElementRenderer.js';
import { InteractionProvider, useInteraction } from './InteractionContext.js';
import { LayoutsProvider, useLayoutDef } from './LayoutsContext.js';
import { cn } from './lib/utils.js';

/**
 * Viewport configuration
 * Use 'auto' or 0 for dimension to use screen default, or specify exact pixels
 */
export interface Viewport {
  width: number | 'auto';
  height: number | 'auto';
}

interface WireRendererProps {
  document: WireDocument;
  screenId?: string;
  viewport?: Viewport;
  onScreenChange?: (screenId: string) => void;
}

/**
 * Main renderer component for WireScript documents
 */
export function WireRenderer({ document, screenId, viewport, onScreenChange }: WireRendererProps) {
  // Find initial screen to render - fall back to first screen if screenId not found
  const initialScreen = screenId
    ? document.screens.find((s) => s.id === screenId) || document.screens[0]
    : document.screens[0];

  if (!initialScreen) {
    return <div className="p-6 text-destructive">No screens defined</div>;
  }

  return (
    <InteractionProvider initialScreen={initialScreen.id} onScreenChange={onScreenChange}>
      <ComponentsProvider components={document.components}>
        <LayoutsProvider layouts={document.layouts}>
          <DocumentRenderer document={document} viewport={viewport} />
        </LayoutsProvider>
      </ComponentsProvider>
    </InteractionProvider>
  );
}

/**
 * Internal component that renders the current screen from context
 */
function DocumentRenderer({
  document,
  viewport,
}: {
  document: WireDocument;
  viewport?: Viewport;
}) {
  const { state } = useInteraction();
  const currentScreenId = state.currentScreen;

  // Find current screen from document - fall back to first screen if not found
  const screen = currentScreenId
    ? document.screens.find((s) => s.id === currentScreenId) || document.screens[0]
    : document.screens[0];

  if (!screen) {
    return <div className="p-6 text-destructive">No screens defined</div>;
  }

  return <ScreenRenderer screen={screen} viewport={viewport} />;
}

interface ScreenRendererProps {
  screen: ScreenNode;
  viewport?: Viewport;
}

/**
 * Recursively replace (slot) elements with the replacement content.
 */
function replaceSlot(node: ElementNode, replacement: ElementNode): ElementNode {
  // If this is the slot, return the replacement
  if (node.elementType === 'slot') {
    return replacement;
  }

  // Otherwise, recursively process children
  return {
    ...node,
    children: node.children.map((child) => {
      if (child.type === 'element') {
        return replaceSlot(child, replacement);
      }
      if (child.type === 'repeat') {
        return {
          ...child,
          body: replaceSlot(child.body, replacement),
        } as RepeatNode;
      }
      return child;
    }),
  };
}

/**
 * Renders a single screen
 */
export function ScreenRenderer({ screen, viewport: externalViewport }: ScreenRendererProps) {
  const { isOverlayOpen, closeOverlay } = useInteraction();
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Get layout if screen references one
  const layoutDef = useLayoutDef(screen.layout || '');

  // Expand layout with screen content, or use screen root directly
  const contentToRender = useMemo(() => {
    if (layoutDef) {
      return replaceSlot(layoutDef.body, screen.root);
    }
    return screen.root;
  }, [layoutDef, screen.root]);

  // Default viewport dimensions based on screen flag
  const defaultSizes = {
    mobile: { width: 375, minHeight: 667 },
    tablet: { width: 768, minHeight: 1024 },
    desktop: { width: 1280, minHeight: 800 },
  };

  const screenViewport = screen.viewport || 'desktop';
  const defaultSize = defaultSizes[screenViewport];

  // Use external viewport if provided (numeric value), otherwise use defaults
  // Both 'auto' and 0 mean "use screen default"
  const useExternalWidth =
    externalViewport && typeof externalViewport.width === 'number' && externalViewport.width > 0;
  const useExternalHeight =
    externalViewport && typeof externalViewport.height === 'number' && externalViewport.height > 0;

  const containerStyle: React.CSSProperties = {
    width: useExternalWidth ? externalViewport.width : defaultSize.width,
    minHeight: useExternalHeight ? externalViewport.height : defaultSize.minHeight,
    height: useExternalHeight ? externalViewport.height : 'auto',
    // Never add internal scroll - let parent container handle scrolling
    overflow: 'visible',
  };

  // Set up portal container for overlays (renders at screen container level but visually full)
  useEffect(() => {
    if (containerRef.current) {
      setPortalContainer(containerRef.current);
    }
  }, []);

  return (
    <AutoActiveProvider screenId={screen.id}>
      <div
        ref={containerRef}
        className="relative bg-background text-foreground font-sans"
        style={containerStyle}
      >
        {/* Main content */}
        <ElementRenderer node={contentToRender} />

        {/* Render ALL overlays for SSG (hidden by default, toggled via JS) */}
        {/* During SSR, portalContainer is null, so render directly without portal */}
        {/* During CSR, use portal for proper stacking context */}
        {screen.overlays.map((overlay) => {
          const isOpen = isOverlayOpen(overlay.id) || overlay.props.open === true;
          const overlayElement = (
            <OverlayRenderer
              key={overlay.id}
              overlay={overlay}
              isOpen={isOpen}
              onClose={() => closeOverlay(overlay.id)}
              containerWidth={containerStyle.width as number}
              containerHeight={
                typeof containerStyle.height === 'number' ? containerStyle.height : undefined
              }
            />
          );
          // Use portal on client, render directly on server
          return portalContainer
            ? createPortal(overlayElement, portalContainer)
            : overlayElement;
        })}
      </div>
    </AutoActiveProvider>
  );
}

interface OverlayRendererProps {
  overlay: OverlayNode;
  isOpen: boolean;
  onClose: () => void;
  containerWidth?: number;
  containerHeight?: number;
}

/**
 * Renders an overlay (modal, drawer, dropdown, popover)
 * Uses fixed positioning relative to viewport for proper full-screen coverage
 */
function OverlayRenderer({
  overlay,
  isOpen,
  onClose,
  containerWidth,
  containerHeight,
}: OverlayRendererProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isDrawer = overlay.overlayType === 'drawer';
  const isLeftDrawer = isDrawer && overlay.props.left === true;
  const isModal = overlay.overlayType === 'modal';
  const isDropdown = overlay.overlayType === 'popover';

  // Calculate overlay dimensions
  const drawerWidth = typeof overlay.props.width === 'number' ? overlay.props.width : 400;
  const maxModalWidth = containerWidth ? Math.min(containerWidth * 0.9, 600) : 600;

  return (
    <div
      className={cn(
        'absolute inset-0 bg-black/50 flex items-center z-50',
        isDrawer && isLeftDrawer && 'justify-start',
        isDrawer && !isLeftDrawer && 'justify-end',
        !isDrawer && 'justify-center'
      )}
      style={{
        minHeight: containerHeight || '100%',
        display: isOpen ? 'flex' : 'none',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'relative bg-popover text-popover-foreground border border-border overflow-auto',
          isDrawer && 'h-full max-h-full rounded-none',
          isModal && 'rounded-lg',
          isDropdown && 'rounded-md min-w-[200px]'
        )}
        style={{
          width: isDrawer ? Math.min(drawerWidth, containerWidth || drawerWidth) : undefined,
          maxWidth: !isDrawer ? maxModalWidth : undefined,
          maxHeight: !isDrawer ? (containerHeight ? containerHeight * 0.9 : '90%') : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {overlay.children.map((child, i) => (
          <ElementRenderer key={`overlay-${overlay.id}-${i}`} node={child} />
        ))}
      </div>
    </div>
  );
}

/**
 * Get all screen IDs from a document
 */
export function getScreenIds(document: WireDocument): string[] {
  return document.screens.map((s) => s.id);
}

/**
 * Get screen info
 */
export function getScreenInfo(document: WireDocument, screenId: string) {
  const screen = document.screens.find((s) => s.id === screenId);
  if (!screen) return null;

  return {
    id: screen.id,
    name: screen.name,
    viewport: screen.viewport || 'desktop',
    overlayCount: screen.overlays.length,
  };
}
