/**
 * Icon Analyzer for WireScript Documents
 *
 * Extracts all icon names used in a document to enable
 * tree-shaking of unused icons from the bundle.
 */

import type {
  ChildNode,
  ElementNode,
  OverlayNode,
  ScreenNode,
  WireDocument,
} from '@wirescript/dsl';

/**
 * Mapping from kebab-case icon names to PascalCase component names
 * This must match the lucide-react export names
 */
const ICON_NAME_MAP: Record<string, string> = {
  activity: 'Activity',
  archive: 'Archive',
  'arrow-down': 'ArrowDown',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  'at-sign': 'AtSign',
  ban: 'Ban',
  bell: 'Bell',
  'bell-off': 'BellOff',
  bluetooth: 'Bluetooth',
  bookmark: 'Bookmark',
  briefcase: 'Briefcase',
  building: 'Building',
  calendar: 'Calendar',
  camera: 'Camera',
  'chart-bar': 'ChartBar',
  check: 'Check',
  'chevron-down': 'ChevronDown',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-up': 'ChevronUp',
  circle: 'Circle',
  'circle-alert': 'CircleAlert',
  'circle-check': 'CircleCheck',
  'circle-help': 'CircleHelp',
  'circle-x': 'CircleX',
  clock: 'Clock',
  cloud: 'Cloud',
  code: 'Code',
  'columns-3': 'Columns3',
  copy: 'Copy',
  cpu: 'Cpu',
  'credit-card': 'CreditCard',
  database: 'Database',
  'dollar-sign': 'DollarSign',
  download: 'Download',
  edit: 'Edit',
  'edit-2': 'Edit2',
  'external-link': 'ExternalLink',
  eye: 'Eye',
  'eye-off': 'EyeOff',
  file: 'File',
  'file-text': 'FileText',
  film: 'Film',
  flag: 'Flag',
  folder: 'Folder',
  'folder-plus': 'FolderPlus',
  'git-branch': 'GitBranch',
  github: 'Github',
  globe: 'Globe',
  grid: 'Grid',
  hash: 'Hash',
  headphones: 'Headphones',
  heart: 'Heart',
  home: 'Home',
  image: 'Image',
  inbox: 'Inbox',
  info: 'Info',
  key: 'Key',
  'layout-grid': 'LayoutGrid',
  link: 'Link',
  linkedin: 'Linkedin',
  list: 'List',
  lock: 'Lock',
  'log-out': 'LogOut',
  mail: 'Mail',
  'map-pin': 'MapPin',
  megaphone: 'Megaphone',
  menu: 'Menu',
  'message-circle': 'MessageCircle',
  'message-square': 'MessageSquare',
  mic: 'Mic',
  minus: 'Minus',
  monitor: 'Monitor',
  moon: 'Moon',
  'more-horizontal': 'MoreHorizontal',
  music: 'Music',
  package: 'Package',
  palette: 'Palette',
  pause: 'Pause',
  percent: 'Percent',
  phone: 'Phone',
  'phone-incoming': 'PhoneIncoming',
  'phone-missed': 'PhoneMissed',
  'phone-off': 'PhoneOff',
  'phone-outgoing': 'PhoneOutgoing',
  'pie-chart': 'PieChart',
  play: 'Play',
  plus: 'Plus',
  'refresh-cw': 'RefreshCw',
  repeat: 'Repeat',
  rocket: 'Rocket',
  save: 'Save',
  search: 'Search',
  send: 'Send',
  server: 'Server',
  settings: 'Settings',
  'share-2': 'Share2',
  shield: 'Shield',
  'shield-check': 'ShieldCheck',
  'shopping-bag': 'ShoppingBag',
  'shopping-cart': 'ShoppingCart',
  smartphone: 'Smartphone',
  smile: 'Smile',
  'square-check': 'SquareCheck',
  'square-plus': 'SquarePlus',
  star: 'Star',
  table: 'Table',
  tablet: 'Tablet',
  tag: 'Tag',
  target: 'Target',
  terminal: 'Terminal',
  'thumbs-up': 'ThumbsUp',
  trash: 'Trash',
  'trash-2': 'Trash2',
  'trending-up': 'TrendingUp',
  'triangle-alert': 'TriangleAlert',
  truck: 'Truck',
  twitter: 'Twitter',
  type: 'Type',
  unlock: 'Unlock',
  upload: 'Upload',
  user: 'User',
  'user-minus': 'UserMinus',
  'user-plus': 'UserPlus',
  users: 'Users',
  'user-x': 'UserX',
  video: 'Video',
  'volume-2': 'Volume2',
  'volume-x': 'VolumeX',
  watch: 'Watch',
  wifi: 'Wifi',
  x: 'X',
  zap: 'Zap',
};

/**
 * Extract all icon names from a WireDocument
 */
export function extractUsedIcons(document: WireDocument): Set<string> {
  const icons = new Set<string>();

  // Process all screens
  for (const screen of document.screens) {
    extractIconsFromScreen(screen, icons);
  }

  // Process all components (they might use icons)
  for (const component of document.components) {
    extractIconsFromElement(component.body, icons);
  }

  // Process all layouts
  for (const layout of document.layouts) {
    extractIconsFromElement(layout.body, icons);
  }

  return icons;
}

function extractIconsFromScreen(screen: ScreenNode, icons: Set<string>): void {
  extractIconsFromElement(screen.root, icons);

  for (const overlay of screen.overlays) {
    extractIconsFromOverlay(overlay, icons);
  }
}

function extractIconsFromOverlay(overlay: OverlayNode, icons: Set<string>): void {
  // Check overlay props for icons
  if (typeof overlay.props.icon === 'string') {
    icons.add(overlay.props.icon.toLowerCase());
  }
  if (typeof overlay.props['icon-name'] === 'string') {
    icons.add(overlay.props['icon-name'].toLowerCase());
  }

  for (const child of overlay.children) {
    extractIconsFromChild(child, icons);
  }
}

function extractIconsFromElement(element: ElementNode, icons: Set<string>): void {
  // Icon element: (icon "name")
  if (element.elementType === 'icon' && typeof element.content === 'string') {
    icons.add(element.content.toLowerCase());
  }

  // Button/other elements with :icon prop
  if (typeof element.props.icon === 'string') {
    icons.add(element.props.icon.toLowerCase());
  }

  // :icon-name prop (used in some contexts)
  if (typeof element.props['icon-name'] === 'string') {
    icons.add(element.props['icon-name'].toLowerCase());
  }

  // Process children
  for (const child of element.children) {
    extractIconsFromChild(child, icons);
  }
}

function extractIconsFromChild(child: ChildNode, icons: Set<string>): void {
  if (child.type === 'element') {
    extractIconsFromElement(child, icons);
  } else if (child.type === 'repeat') {
    extractIconsFromElement(child.body, icons);
  }
}

/**
 * Get the PascalCase component name for an icon
 */
export function getIconComponentName(iconName: string): string | undefined {
  return ICON_NAME_MAP[iconName.toLowerCase()];
}

/**
 * Generate lucide-react import statement for a set of icons
 */
export function generateIconImports(icons: Set<string>): string {
  const componentNames: string[] = [];

  for (const iconName of icons) {
    const componentName = getIconComponentName(iconName);
    if (componentName) {
      componentNames.push(componentName);
    }
  }

  if (componentNames.length === 0) {
    return '';
  }

  // Sort for consistent output
  componentNames.sort();

  return `import { ${componentNames.join(', ')} } from 'lucide-react';`;
}

/**
 * Generate icon registry code for a set of icons
 */
export function generateIconRegistry(icons: Set<string>): string {
  const entries: string[] = [];

  for (const iconName of icons) {
    const componentName = getIconComponentName(iconName);
    if (componentName) {
      entries.push(`  '${iconName}': ${componentName}`);
    }
  }

  if (entries.length === 0) {
    return 'const iconRegistry: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {};';
  }

  // Sort for consistent output
  entries.sort();

  return `const iconRegistry: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
${entries.join(',\n')}
};`;
}

/**
 * Generate a complete minimal icons.tsx replacement module
 * This can be used as a Vite alias to replace the full icons module
 */
export function generateMinimalIconsModule(icons: Set<string>): string {
  const componentNames: string[] = [];
  const registryEntries: string[] = [];

  for (const iconName of icons) {
    const componentName = getIconComponentName(iconName);
    if (componentName) {
      componentNames.push(componentName);
      registryEntries.push(`  '${iconName}': ${componentName},`);
    }
  }

  // Sort for consistent output
  componentNames.sort();
  registryEntries.sort();

  const imports =
    componentNames.length > 0 ? `import { ${componentNames.join(', ')} } from 'lucide-react';` : '';

  return `/**
 * Minimal icon registry - auto-generated for this document
 * Only includes icons actually used: ${icons.size} icons
 */
import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
${imports}

type IconComponent = ComponentType<LucideProps>;

export const iconRegistry: Record<string, IconComponent> = {
${registryEntries.join('\n')}
};

export function getIcon(name: string): IconComponent | undefined {
  return iconRegistry[name.toLowerCase()];
}

export function IconFallback({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 text-[10px] text-muted-foreground bg-muted rounded"
      title={\`Unknown icon: \${name}\`}
    >
      ?
    </span>
  );
}
`;
}
