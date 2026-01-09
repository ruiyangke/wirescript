import type { ElementNode } from '@wirescript/dsl';
import { useIsAutoActive } from '../AutoActiveContext.js';
import { useInteraction } from '../InteractionContext.js';
import { toText } from '../layout.js';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Breadcrumb as ShadcnBreadcrumb,
} from '../ui/breadcrumb.js';

interface BreadcrumbProps {
  element: ElementNode;
}

export function Breadcrumb({ element }: BreadcrumbProps) {
  const { children } = element;

  const crumbChildren = children.filter(
    (child): child is ElementNode => child.type === 'element' && child.elementType === 'crumb'
  );

  return (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        {crumbChildren.map((child, i) => {
          const isLast = i === crumbChildren.length - 1;
          const crumbText = toText(child.content);
          const crumbKey = crumbText ? `crumb-${crumbText}` : `crumb-${i}`;
          return (
            <BreadcrumbItem key={crumbKey}>
              <Crumb element={child} isLast={isLast} />
              {!isLast && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
}

interface CrumbProps {
  element: ElementNode;
  isLast?: boolean;
}

export function Crumb({ element, isLast = false }: CrumbProps) {
  const { content, props } = element;
  const { navigateTo } = useInteraction();
  const isAutoActive = useIsAutoActive(element);
  const textContent = toText(content);

  const to = props.to as string | undefined;
  const isActive = props.active === true || isAutoActive || isLast;

  const handleClick = (e: React.MouseEvent) => {
    if (to && !isLast) {
      e.preventDefault();
      navigateTo(to);
    }
  };

  if (isLast || isActive) {
    return <BreadcrumbPage>{textContent}</BreadcrumbPage>;
  }

  return (
    <BreadcrumbLink href={to || '#'} onClick={handleClick}>
      {textContent}
    </BreadcrumbLink>
  );
}
