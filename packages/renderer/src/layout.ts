import type { ContentValue, ElementNode, PropValue } from '@wirescript/dsl';
import type { CSSProperties } from 'react';

/**
 * Convert ContentValue (string | ParamRef) to displayable string
 */
export function toText(value: ContentValue | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  // ParamRef - show placeholder
  if (typeof value === 'object' && value.type === 'param') {
    return `{${value.name}}`;
  }
  return '';
}

/**
 * Convert PropValue to displayable string
 */
export function propToText(value: PropValue | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return '';
  // Reference types - show placeholder or value
  if (typeof value === 'object' && 'type' in value) {
    switch (value.type) {
      case 'param':
        return `{${value.name}}`;
      case 'screen':
        return value.id;
      case 'overlay':
        return value.id;
      case 'action':
        return value.action;
      case 'url':
        return value.url;
      default:
        return '';
    }
  }
  return '';
}

/**
 * Check if a prop is truthy (handles boolean flags)
 */
function hasProp(props: Record<string, PropValue>, key: string): boolean {
  return props[key] === true;
}

/**
 * Get prop value as number if it's a number
 */
function getNumericProp(props: Record<string, PropValue>, key: string): number | undefined {
  const val = props[key];
  return typeof val === 'number' ? val : undefined;
}

/**
 * Get prop value as string
 */
function getStringProp(props: Record<string, PropValue>, key: string): string | undefined {
  const val = props[key];
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return undefined;
}

/**
 * Convert element props to CSS styles
 */
export function getLayoutStyles(element: ElementNode): CSSProperties {
  const styles: CSSProperties = {};
  const { props } = element;

  // Layout direction
  if (hasProp(props, 'row')) {
    styles.display = 'flex';
    styles.flexDirection = 'row';
  } else if (hasProp(props, 'col')) {
    styles.display = 'flex';
    styles.flexDirection = 'column';
  } else if (hasProp(props, 'grid')) {
    styles.display = 'grid';
  }

  // Default to flex column for containers with children
  if (!styles.display && element.children.length > 0) {
    styles.display = 'flex';
    styles.flexDirection = 'column';
  }

  // Alignment
  if (hasProp(props, 'center')) {
    styles.justifyContent = 'center';
    styles.alignItems = 'center';
  }
  if (hasProp(props, 'start')) {
    styles.alignItems = 'flex-start';
  }
  if (hasProp(props, 'end')) {
    styles.alignItems = 'flex-end';
    styles.justifyContent = 'flex-end';
  }
  if (hasProp(props, 'between')) {
    styles.justifyContent = 'space-between';
  }
  if (hasProp(props, 'around')) {
    styles.justifyContent = 'space-around';
  }
  if (hasProp(props, 'stretch')) {
    styles.alignItems = 'stretch';
  }

  // Wrap
  if (hasProp(props, 'wrap')) {
    styles.flexWrap = 'wrap';
  }

  // Size
  if (hasProp(props, 'full')) {
    styles.width = '100%';
    styles.height = '100%';
    styles.flex = 1;
    styles.minWidth = 0;
    styles.minHeight = 0;
  }
  if (hasProp(props, 'fit')) {
    styles.width = 'fit-content';
  }
  if (hasProp(props, 'fill')) {
    styles.flex = 1;
    styles.minWidth = 0;
    styles.minHeight = 0;
  }

  // Gap
  const gap = getNumericProp(props, 'gap');
  if (gap !== undefined) {
    styles.gap = gap;
  }

  // Padding
  const padding = getNumericProp(props, 'padding');
  if (padding !== undefined) {
    styles.padding = padding;
  }

  // Grid columns
  const cols = getNumericProp(props, 'cols');
  if (cols !== undefined && styles.display === 'grid') {
    styles.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  // Grid rows
  const rows = getNumericProp(props, 'rows');
  if (rows !== undefined && styles.display === 'grid') {
    styles.gridTemplateRows = `repeat(${rows}, 1fr)`;
  }

  // Width
  const width = getStringProp(props, 'width');
  if (width) {
    styles.width = width.includes('%') || width.includes('px') ? width : `${width}%`;
    styles.flexShrink = 0;
  }

  // Height
  const height = getStringProp(props, 'height');
  if (height) {
    styles.height = height.includes('%') || height.includes('px') ? height : `${height}px`;
  }

  // Position
  if (hasProp(props, 'sticky')) styles.position = 'sticky';
  if (hasProp(props, 'fixed')) styles.position = 'fixed';
  if (hasProp(props, 'absolute')) styles.position = 'absolute';
  if (hasProp(props, 'relative')) styles.position = 'relative';

  // Position values
  const top = getNumericProp(props, 'top');
  const left = getNumericProp(props, 'left');
  const right = getNumericProp(props, 'right');
  const bottom = getNumericProp(props, 'bottom');
  if (top !== undefined) styles.top = top;
  if (left !== undefined) styles.left = left;
  if (right !== undefined) styles.right = right;
  if (bottom !== undefined) styles.bottom = bottom;

  return styles;
}

/**
 * Get emphasis level from props
 */
export function getEmphasis(props: Record<string, PropValue>): 'high' | 'medium' | 'low' {
  if (hasProp(props, 'high')) return 'high';
  if (hasProp(props, 'low')) return 'low';
  return 'medium';
}

/**
 * Get variant from props
 */
export function getVariant(props: Record<string, PropValue>): string | undefined {
  const variants = ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning', 'info'];
  return variants.find((v) => hasProp(props, v));
}

/**
 * Check if element has a boolean prop set to true
 */
export function hasFlag(props: Record<string, PropValue>, flag: string): boolean {
  return hasProp(props, flag);
}
