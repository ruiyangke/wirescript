interface CollapseButtonProps {
  collapsed: boolean;
  onClick: () => void;
  position: 'left' | 'right';
  offset?: number;
  title?: string;
}

/**
 * A button that toggles collapse state for panels.
 * Can be positioned on left or right edge of a panel.
 */
export function CollapseButton({
  collapsed,
  onClick,
  position,
  offset = 0,
  title,
}: CollapseButtonProps) {
  const isLeft = position === 'left';

  // Arrow points left when expanded (will collapse), right when collapsed (will expand)
  const arrowRotation = collapsed ? (isLeft ? 'rotate-180' : '') : isLeft ? '' : 'rotate-180';

  const positionStyle = isLeft ? { left: offset - 3 } : { right: offset - 3 };

  const roundedClass = isLeft ? 'rounded-r' : 'rounded-l';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-gray-700 hover:bg-gray-600 text-white ${roundedClass} flex items-center justify-center shadow-md transition-all duration-300`}
      style={positionStyle}
      title={title || (collapsed ? 'Expand' : 'Collapse')}
    >
      <svg
        className={`w-4 h-4 transition-transform duration-300 ${arrowRotation}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
