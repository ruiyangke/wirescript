import { useCallback, useEffect, useState } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

/**
 * A draggable handle for resizing panels.
 * - horizontal: resizes left/right (changes width)
 * - vertical: resizes up/down (changes height)
 */
export function ResizeHandle({ direction, onResize, onResizeEnd }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartPos(direction === 'horizontal' ? e.clientX : e.clientY);
    },
    [direction]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      setStartPos(currentPos);
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    // Add listeners to document to capture mouse events outside the handle
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, startPos, direction, onResize, onResizeEnd]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`
        flex-shrink-0 relative group
        ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-400'}
        transition-colors duration-150
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Larger hit area for easier grabbing */}
      <div
        className={`
          absolute
          ${
            isHorizontal
              ? 'top-0 bottom-0 -left-1 -right-1 w-3'
              : 'left-0 right-0 -top-1 -bottom-1 h-3'
          }
        `}
      />
      {/* Visual indicator on hover/drag */}
      <div
        className={`
          absolute opacity-0 group-hover:opacity-100 transition-opacity
          ${isDragging ? 'opacity-100' : ''}
          ${
            isHorizontal
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-8 bg-blue-500 rounded-full'
          }
        `}
      />
    </div>
  );
}
