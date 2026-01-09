import type { ElementNode } from '@wirescript/dsl';
import { getEmphasis, toText } from '../layout.js';
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from '../ui/avatar.js';

interface AvatarProps {
  element: ElementNode;
}

export function Avatar({ element }: AvatarProps) {
  const { content, props } = element;
  const emphasis = getEmphasis(props);
  const isActive = props.active === true;
  const src = props.src as string | undefined;
  const textContent = toText(content);

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

  return (
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
}
