import type { ElementNode } from '@wirescript/dsl';
import { useInteraction } from '../InteractionContext.js';
import { getEmphasis, toText } from '../layout.js';
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from '../ui/avatar.js';

interface AvatarProps {
  element: ElementNode;
}

export function Avatar({ element }: AvatarProps) {
  const { content, props } = element;
  const { handleAction } = useInteraction();
  const emphasis = getEmphasis(props);
  const isActive = props.active === true;
  const src = props.src as string | undefined;
  const textContent = toText(content);
  const toValue = props.to;

  // Generate initials from content
  const initials = textContent
    ? textContent
        .split(' ')
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Size config: avatarSize in px, dot size, and pre-calculated offset
  // Offset positions the dot so its center sits on the circle edge at 45° (bottom-right)
  const sizeConfig = {
    high: { size: 56, className: 'text-xl', dotSize: 12, dotOffset: 2 },
    medium: { size: 40, className: 'text-base', dotSize: 10, dotOffset: 1 },
    low: { size: 32, className: 'text-sm', dotSize: 8, dotOffset: 0 },
  };

  const config = sizeConfig[emphasis];

  // Handle click for :to prop
  const handleClick = () => {
    if (!toValue) return;
    if (typeof toValue === 'object' && 'type' in toValue) {
      switch (toValue.type) {
        case 'screen':
          handleAction(toValue.id);
          break;
        case 'overlay':
          handleAction(`#${toValue.id}`);
          break;
        case 'action':
          handleAction(`:${toValue.action}`);
          break;
        case 'url':
          window.open(toValue.url, '_blank');
          break;
      }
    } else if (typeof toValue === 'string') {
      handleAction(toValue);
    }
  };

  const avatarElement = (
    <div className="relative inline-block" style={{ width: config.size, height: config.size }}>
      <ShadcnAvatar
        className={config.className}
        style={{ width: config.size, height: config.size }}
      >
        {src && <AvatarImage src={src} alt={textContent || 'Avatar'} />}
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {initials}
        </AvatarFallback>
      </ShadcnAvatar>
      {isActive && (
        <span
          className="absolute block rounded-full bg-green-500 ring-2 ring-background"
          style={{
            width: config.dotSize,
            height: config.dotSize,
            bottom: config.dotOffset,
            right: config.dotOffset,
          }}
          title="Online"
        />
      )}
    </div>
  );

  // Wrap in clickable button if :to is provided
  if (toValue) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {avatarElement}
      </button>
    );
  }

  return avatarElement;
}
