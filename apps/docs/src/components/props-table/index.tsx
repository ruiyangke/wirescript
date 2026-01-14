'use client';

import type { ElementSchema, PropSchema } from '@wirescript/dsl';
import schemas from '@wirescript/dsl/schemas.json';

interface PropsTableProps {
  /** Element name to show props for */
  element?: string;
  /** Overlay name to show props for (modal, drawer, popover) */
  overlay?: string;
  /** Only show specific prop categories */
  only?: string[];
  /** Exclude specific prop categories */
  exclude?: string[];
}

// Categorize props by their semantic group
const PROP_CATEGORIES: Record<string, { label: string; props: string[] }> = {
  identity: {
    label: 'Identity',
    props: ['id'],
  },
  layout: {
    label: 'Layout',
    props: ['row', 'col', 'grid', 'wrap', 'cols', 'rows'],
  },
  alignment: {
    label: 'Alignment',
    props: ['center', 'start', 'end', 'between', 'around', 'stretch'],
  },
  sizing: {
    label: 'Sizing',
    props: ['full', 'fit', 'fill', 'size'],
  },
  spacing: {
    label: 'Spacing',
    props: ['gap', 'padding'],
  },
  dimensions: {
    label: 'Dimensions',
    props: ['width', 'height'],
  },
  position: {
    label: 'Position',
    props: ['sticky', 'fixed', 'absolute', 'relative', 'top', 'left', 'right', 'bottom', 'position'],
  },
  variant: {
    label: 'Variants',
    props: ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning', 'info'],
  },
  emphasis: {
    label: 'Emphasis',
    props: ['high', 'medium', 'low'],
  },
  state: {
    label: 'State',
    props: ['disabled', 'loading', 'active', 'checked', 'open', 'error'],
  },
  navigation: {
    label: 'Navigation',
    props: ['to'],
  },
  input: {
    label: 'Input',
    props: ['type', 'placeholder', 'value', 'options', 'min', 'max', 'step', 'rows'],
  },
  content: {
    label: 'Content',
    props: ['icon', 'src', 'alt', 'name', 'label', 'title', 'change', 'trend', 'message'],
  },
  shape: {
    label: 'Shape',
    props: ['circle', 'text'],
  },
};

function formatType(prop: PropSchema): string {
  if (prop.type === 'boolean') return 'flag';
  if (prop.type === 'navigation') return 'target';
  return prop.type;
}

function formatDefault(prop: PropSchema): string {
  if (prop.default === undefined) return '-';
  if (prop.type === 'boolean') return '-'; // flags don't show default
  return String(prop.default);
}

function categorizeProp(propName: string): string {
  for (const [category, { props }] of Object.entries(PROP_CATEGORIES)) {
    if (props.includes(propName)) return category;
  }
  return 'other';
}

export function PropsTable({ element, overlay, only, exclude }: PropsTableProps) {
  let schema: ElementSchema;
  let props: Record<string, PropSchema>;

  if (overlay) {
    // For overlays, use the shared overlay props
    const overlayProps = (schemas.overlays as { props: Record<string, PropSchema> }).props;
    props = overlayProps;
    schema = { type: overlay, content: true, children: true, props: overlayProps };
  } else if (element) {
    const elementSchema = (schemas.elements as Record<string, ElementSchema>)[element];
    if (!elementSchema) {
      return (
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Unknown element: {element}
        </div>
      );
    }
    schema = elementSchema;
    props = elementSchema.props;
  } else {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded">
        PropsTable requires either element or overlay prop
      </div>
    );
  }

  const propEntries = Object.entries(props) as [string, PropSchema][];

  // Group props by category
  const grouped: Record<string, [string, PropSchema][]> = {};
  for (const [name, prop] of propEntries) {
    const category = categorizeProp(name);

    // Apply only/exclude filters
    if (only && !only.includes(category)) continue;
    if (exclude?.includes(category)) continue;

    if (!grouped[category]) grouped[category] = [];
    grouped[category].push([name, prop]);
  }

  // Sort categories in a logical order
  const categoryOrder = [
    'identity',
    'layout',
    'alignment',
    'sizing',
    'spacing',
    'dimensions',
    'position',
    'shape',
    'variant',
    'emphasis',
    'state',
    'navigation',
    'input',
    'content',
    'other',
  ];
  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length > 0);

  return (
    <div className="space-y-6">
      {/* Element info */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        {schema.content && <span className="px-2 py-1 bg-muted rounded">accepts content</span>}
        {schema.children && <span className="px-2 py-1 bg-muted rounded">accepts children</span>}
      </div>

      {/* Props by category */}
      {sortedCategories.map((category) => {
        const categoryInfo = PROP_CATEGORIES[category] || { label: 'Element-specific', props: [] };
        const categoryProps = grouped[category];

        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              {categoryInfo.label}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Property</th>
                    <th className="text-left py-2 pr-4 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryProps.map(([name, prop]) => (
                    <tr key={name} className="border-b border-muted">
                      <td className="py-2 pr-4">
                        <code className="text-primary">:{name}</code>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatType(prop)}</td>
                      <td className="py-2 text-muted-foreground">{formatDefault(prop)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple flat props table without categories
 */
export function PropsList({ element }: { element: string }) {
  const schema = (schemas.elements as Record<string, ElementSchema>)[element];

  if (!schema) {
    return <div className="text-red-500">Unknown element: {element}</div>;
  }

  const { props } = schema;
  const propEntries = Object.entries(props);

  // Separate flags from value props
  const flags = propEntries.filter(([, p]) => p.type === 'boolean');
  const valueProps = propEntries.filter(([, p]) => p.type !== 'boolean');

  return (
    <div className="space-y-6">
      {flags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Flags</h4>
          <div className="flex flex-wrap gap-2">
            {flags.map(([name]) => (
              <code key={name} className="px-2 py-1 bg-muted rounded text-sm">
                :{name}
              </code>
            ))}
          </div>
        </div>
      )}

      {valueProps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Properties</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Property</th>
                <th className="text-left py-2 pr-4 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {valueProps.map(([name, prop]) => (
                <tr key={name} className="border-b border-muted">
                  <td className="py-2 pr-4">
                    <code className="text-primary">:{name}</code>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{formatType(prop)}</td>
                  <td className="py-2 text-muted-foreground">{formatDefault(prop)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Compact flags display
 */
export function FlagsDisplay({ element }: { element: string }) {
  const schema = (schemas.elements as Record<string, ElementSchema>)[element];
  if (!schema) return null;

  const flags = Object.entries(schema.props)
    .filter(([, p]) => p.type === 'boolean')
    .map(([name]) => name);

  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((name) => (
        <code key={name} className="px-2 py-1 bg-muted rounded text-sm">
          :{name}
        </code>
      ))}
    </div>
  );
}
