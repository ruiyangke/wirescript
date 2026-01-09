import type { ElementNode } from '@wirescript/dsl';
import type { ComponentType } from 'react';
import { Avatar } from './Avatar.js';
import { Badge } from './Badge.js';
// Element components
import { Box } from './Box.js';
import { Breadcrumb, Crumb } from './Breadcrumb.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { DatePicker } from './DatePicker.js';
import { Divider } from './Divider.js';
import { Dropdown } from './Dropdown.js';
import { Empty } from './Empty.js';
import { Footer } from './Footer.js';
import { Header } from './Header.js';
import { Icon } from './Icon.js';
import { Image } from './Image.js';
import { Input } from './Input.js';
import { Metric } from './Metric.js';
import { Nav } from './Nav.js';
import { Progress } from './Progress.js';
import { Scroll } from './Scroll.js';
import { Skeleton } from './Skeleton.js';
import { Tab, Tabs } from './Tabs.js';
import { Text } from './Text.js';
import { Toast } from './Toast.js';
import { Tooltip } from './Tooltip.js';

// Re-export all element components
export {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
  Button,
  Card,
  Crumb,
  DatePicker,
  Divider,
  Dropdown,
  Empty,
  Footer,
  Header,
  Icon,
  Image,
  Input,
  Metric,
  Nav,
  Progress,
  Scroll,
  Skeleton,
  Tab,
  Tabs,
  Text,
  Toast,
  Tooltip,
};

interface ElementProps {
  element: ElementNode;
}

/** Registry of element components */
export const elementRegistry: Record<string, ComponentType<ElementProps>> = {
  // Containers
  box: Box,
  card: Card,
  section: Box, // Renders same as box
  header: Header,
  footer: Footer,
  nav: Nav,
  form: Box,
  list: Box,
  scroll: Scroll,
  group: Box,

  // Content
  text: Text,
  button: Button,
  dropdown: Dropdown,
  input: Input,
  image: Image,
  icon: Icon,
  divider: Divider,
  avatar: Avatar,
  badge: Badge,
  datepicker: DatePicker,

  // Data
  metric: Metric,
  chart: Image, // Placeholder - charts need custom implementation
  progress: Progress,
  skeleton: Skeleton,

  // Navigation
  tabs: Tabs,
  tab: Tab,
  breadcrumb: Breadcrumb,
  crumb: Crumb,

  // Utility
  tooltip: Tooltip,
  toast: Toast,
  empty: Empty,

  // Layout (slot should be replaced during layout expansion, this is a fallback)
  slot: () => null,

  // Special container for repeat elements (renders children without wrapper)
  'repeat-container': Box,
};

/** Get element component for type */
export function getElementComponent(type: string): ComponentType<ElementProps> | undefined {
  return elementRegistry[type];
}
