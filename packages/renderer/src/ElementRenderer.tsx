import type {
  ComponentDef,
  ContentValue,
  ElementNode,
  PropValue,
  RepeatNode,
} from '@wirescript/dsl';
import { useComponentDef } from './ComponentsContext.js';
import { Box } from './elements/Box.js';
import { getElementComponent } from './elements/index.js';

type RenderNode = ElementNode | RepeatNode;

/**
 * Generate a stable key for an element node
 * Uses element type, content hash, and index for uniqueness
 */
function generateElementKey(node: RenderNode, index: number): string {
  if (node.type === 'repeat') {
    const count = typeof node.count === 'number' ? node.count : 'param';
    return `repeat-${count}-${node.as || ''}-${index}`;
  }
  // For elements, use type + content hash + props hash for better stability
  const content = typeof node.content === 'string' ? node.content : '';
  const contentHash = content ? simpleHash(content) : '';
  const propsHash =
    Object.keys(node.props).length > 0 ? simpleHash(JSON.stringify(node.props)) : '';
  return `${node.elementType}-${contentHash}-${propsHash}-${index}`;
}

/**
 * Simple hash function for strings
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Export for use in other components
export { generateElementKey };

interface ElementRendererProps {
  node: RenderNode;
}

/**
 * Renders any AST node (element or repeat)
 */
export function ElementRenderer({ node }: ElementRendererProps) {
  if (node.type === 'repeat') {
    return <RepeatRenderer repeat={node} />;
  }

  // Element node - check if it's a component call
  if (node.isComponent) {
    return <ComponentCallRenderer element={node} />;
  }

  // Regular element
  const Component = getElementComponent(node.elementType);

  if (!Component) {
    // Unknown element type - render as box with children
    console.warn(`Unknown element type: ${node.elementType}`);
    return <Box element={node} />;
  }

  return <Component element={node} />;
}

/**
 * Renders a repeat node by duplicating its body
 */
function RepeatRenderer({ repeat }: { repeat: RepeatNode }) {
  const items = [];

  // Get count as number (if it's a ParamRef, default to 0)
  const count = typeof repeat.count === 'number' ? repeat.count : 0;

  for (let i = 0; i < count; i++) {
    // TODO: Handle ${var} interpolation with repeat.as
    const body = interpolateRepeatBody(repeat.body, repeat.as, i);
    items.push(<ElementRenderer key={`repeat-item-${repeat.as || 'i'}-${i}`} node={body} />);
  }

  return <>{items}</>;
}

/**
 * Interpolate ${var} in repeat body content and props
 */
function interpolateRepeatBody(
  element: ElementNode,
  varName: string | undefined,
  index: number
): ElementNode {
  if (!varName) return element;

  const pattern = new RegExp(`\\$\\{${varName}\\}`, 'g');
  const replacement = String(index + 1);

  // Get content as string
  const contentStr = typeof element.content === 'string' ? element.content : '';

  // Interpolate props
  const interpolatedProps: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(element.props)) {
    if (typeof value === 'string') {
      interpolatedProps[key] = value.replace(pattern, replacement);
    } else {
      interpolatedProps[key] = value;
    }
  }

  // Deep clone and interpolate content and props
  const clone: ElementNode = {
    ...element,
    content: contentStr ? contentStr.replace(pattern, replacement) : undefined,
    props: interpolatedProps,
    children: element.children.map((child) => {
      if (child.type === 'element') {
        return interpolateRepeatBody(child, varName, index);
      }
      if (child.type === 'repeat') {
        return {
          ...child,
          body: interpolateRepeatBody(child.body, varName, index),
        };
      }
      return child;
    }),
  };

  return clone;
}

/**
 * Renders a component call by expanding its definition with args
 */
function ComponentCallRenderer({ element }: { element: ElementNode }) {
  const componentDef = useComponentDef(element.elementType);

  if (!componentDef) {
    // Component not found - render children as fallback
    console.warn(`Component definition not found: ${element.elementType}`);
    return (
      <>
        {element.children.map((child: ElementNode | RepeatNode, i: number) => (
          <ElementRenderer key={generateElementKey(child, i)} node={child} />
        ))}
      </>
    );
  }

  // Expand the component body with args and children
  const expandedBody = expandComponent(
    componentDef,
    element.props,
    element.children as ElementNode[]
  );
  return <ElementRenderer node={expandedBody} />;
}

/**
 * Expand a component definition with the given args and children
 */
function expandComponent(
  def: ComponentDef,
  args: Record<string, PropValue>,
  children: ElementNode[]
): ElementNode {
  return expandElementWithParams(def.body, def.params, args, children);
}

/**
 * Deep clone an element and substitute param references with actual values
 */
function expandElementWithParams(
  element: ElementNode,
  params: string[],
  args: Record<string, PropValue>,
  injectChildren: ElementNode[]
): ElementNode {
  // Clone the element
  const clone: ElementNode = {
    type: 'element',
    elementType: element.elementType,
    content: substituteContent(element.content, params, args),
    props: substitutePropsParams(element.props, params, args),
    children: [],
  };

  // Process children
  for (const child of element.children) {
    if (child.type === 'element') {
      // Check for special "children" placeholder element
      if (child.elementType === 'children') {
        // Inject the call's children here
        clone.children.push(...injectChildren);
      } else {
        clone.children.push(expandElementWithParams(child, params, args, injectChildren));
      }
    } else if (child.type === 'repeat') {
      // Clone repeat with expanded body
      clone.children.push({
        type: 'repeat',
        count: child.count,
        as: child.as,
        body: expandElementWithParams(child.body, params, args, injectChildren),
      });
    }
  }

  return clone;
}

/**
 * Substitute content - handles both string and ParamRef content
 */
function substituteContent(
  content: ContentValue | undefined,
  params: string[],
  args: Record<string, PropValue>
): ContentValue | undefined {
  if (!content) return content;

  // If content is a ParamRef, look it up in args
  if (typeof content === 'object') {
    if (content.type === 'param') {
      const argValue = args[content.name];
      if (argValue !== undefined) {
        // Convert PropValue to ContentValue (string or ParamRef)
        if (typeof argValue === 'string') return argValue;
        if (typeof argValue === 'number') return String(argValue);
        if (typeof argValue === 'boolean') return String(argValue);
        // If argValue is a ParamRef or NavigationTarget, return as-is or convert
        if (typeof argValue === 'object' && 'type' in argValue && argValue.type === 'param') {
          return argValue;
        }
      }
      // No matching arg found, return undefined (param not resolved)
      return undefined;
    }
    // Other object type - return as-is
    return content;
  }

  // String content - substitute $param patterns
  return substituteParams(content, params, args);
}

/**
 * Substitute $param references in a string
 */
function substituteParams(
  str: string | undefined,
  params: string[],
  args: Record<string, PropValue>
): string | undefined {
  if (!str) return str;

  let result = str;
  for (const param of params) {
    const pattern = new RegExp(`\\$${param}`, 'g');
    const value = args[param];
    if (value !== undefined && typeof value !== 'object') {
      result = result.replace(pattern, String(value));
    }
  }
  return result;
}

/**
 * Substitute $param references in props
 */
function substitutePropsParams(
  props: Record<string, PropValue>,
  params: string[],
  args: Record<string, PropValue>
): Record<string, PropValue> {
  const result: Record<string, PropValue> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      // Check if the value is exactly a param reference (e.g., "$value")
      // In this case, preserve the original type from args
      let substituted = false;
      for (const param of params) {
        if (value === `$${param}`) {
          const argValue = args[param];
          if (argValue !== undefined) {
            result[key] = argValue; // Preserve type
            substituted = true;
            break;
          }
        }
      }
      // If not set yet, do string substitution
      if (!substituted) {
        result[key] = substituteParams(value, params, args) ?? value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}
