import { useCallback, useEffect, useRef } from 'react';

interface EditorDrawerHandleProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onResize: (delta: number) => void;
}

const DRAG_THRESHOLD = 5; // pixels of movement before it's considered a drag

/**
 * A unified rail handle for the editor drawer.
 *
 * Interaction model (same in both states):
 * - Click the rail → toggle collapse/expand
 * - Drag the rail → resize (only when expanded)
 *
 * Visual design:
 * - Fixed-width rail with centered chevron
 * - Chevron direction indicates action: ◀ collapse, ▶ expand
 * - Hover highlights the rail
 * - Dragging shows blue active state
 */
export function EditorDrawerHandle({
  collapsed,
  onCollapsedChange,
  onResize,
}: EditorDrawerHandleProps) {
  // Use refs to avoid stale closure issues
  const collapsedRef = useRef(collapsed);
  const onCollapsedChangeRef = useRef(onCollapsedChange);
  const onResizeRef = useRef(onResize);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Keep refs in sync with props
  useEffect(() => {
    collapsedRef.current = collapsed;
    onCollapsedChangeRef.current = onCollapsedChange;
    onResizeRef.current = onResize;
  }, [collapsed, onCollapsedChange, onResize]);

  // Handle mouse move - resize if dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaFromStart = Math.abs(e.clientX - startXRef.current);

    // Check if we've moved past the drag threshold
    if (deltaFromStart > DRAG_THRESHOLD && !collapsedRef.current) {
      hasDraggedRef.current = true;

      // Calculate delta from last position for smooth resizing
      const delta = e.clientX - currentXRef.current;
      currentXRef.current = e.clientX;
      onResizeRef.current(delta);
    }
  }, []);

  // Handle mouse up - either toggle or end drag
  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    const wasDragging = isDraggingRef.current;
    const didDrag = hasDraggedRef.current;

    isDraggingRef.current = false;
    hasDraggedRef.current = false;

    // If it was a click (no drag), toggle collapse
    if (wasDragging && !didDrag) {
      onCollapsedChangeRef.current(!collapsedRef.current);
    }
  }, [handleMouseMove]);

  // Handle mouse down - start potential drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;

    // Add document-level listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    if (!collapsedRef.current) {
      document.body.style.cursor = 'col-resize';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`
        flex-shrink-0 h-full flex items-center justify-center
        transition-colors duration-100 select-none
        w-5 bg-gray-100 hover:bg-blue-100 active:bg-blue-500
        border-l border-gray-200
        ${collapsed ? 'cursor-pointer' : 'cursor-col-resize'}
        group
      `}
      onMouseDown={handleMouseDown}
      title={collapsed ? 'Show editor' : 'Hide editor (or drag to resize)'}
    >
      {/* Chevron icon - direction indicates action */}
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-active:text-white transition-colors duration-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {collapsed ? (
          // Right chevron: click to expand
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        ) : (
          // Left chevron: click to collapse
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        )}
      </svg>
    </div>
  );
}
