/**
 * Island hydration runtime
 *
 * Finds elements marked with data-island attributes and hydrates them
 * with their corresponding React components.
 *
 * NOTE: This runtime does NOT import from @wirescript/renderer to avoid
 * pulling in heavy dependencies like lucide-react. Instead, the bundled
 * entry point should provide the component registry.
 */

import type { PropValue } from '@wirescript/dsl';
import { type ComponentType, createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { AutoActiveProvider } from './contexts/AutoActiveContext.js';
import { InteractionProvider } from './contexts/InteractionContext.js';

/** Component props shape */
interface ElementProps {
  element: {
    type: string;
    elementType: string;
    content?: string;
    props: Record<string, PropValue>;
    children: unknown[];
  };
}

/** Global component registry - populated by entry point */
let componentRegistry: Record<string, ComponentType<ElementProps>> = {};

/**
 * Register components for hydration.
 * Called by the bundled entry point before hydration.
 */
export function registerComponents(components: Record<string, ComponentType<ElementProps>>): void {
  componentRegistry = components;
}

/**
 * Get a registered component by type
 */
function getElementComponent(type: string): ComponentType<ElementProps> | undefined {
  return componentRegistry[type];
}

/** Global WireScript data injected by SSG */
declare global {
  interface Window {
    __WIRESCRIPT_DATA__?: WireScriptData;
  }
}

export interface WireScriptData {
  currentScreen: string;
  screens: Array<{ id: string; name: string; url: string }>;
}

export interface IslandElement {
  container: HTMLElement;
  type: string;
  props: Record<string, PropValue>;
  children?: string;
}

/**
 * Find all island markers in the document
 */
export function findIslands(): IslandElement[] {
  const islands: IslandElement[] = [];
  const elements = document.querySelectorAll('[data-island]');

  elements.forEach((el) => {
    const container = el as HTMLElement;
    const type = container.getAttribute('data-island');
    const propsJson = container.getAttribute('data-island-props');
    const children = container.getAttribute('data-island-children');

    if (!type) return;

    let props: Record<string, PropValue> = {};
    try {
      props = propsJson ? (JSON.parse(propsJson) as Record<string, PropValue>) : {};
    } catch {
      console.warn(`[WireScript] Invalid island props for ${type}:`, propsJson);
    }

    islands.push({
      container,
      type,
      props,
      children: children || undefined,
    });
  });

  return islands;
}

/**
 * Hydrate a single island element
 */
export function hydrateIsland(
  island: IslandElement,
  providers: {
    screenId: string;
    screenUrls: Record<string, string>;
  }
): void {
  const Component = getElementComponent(island.type);
  if (!Component) {
    console.warn(`[WireScript] Unknown island component: ${island.type}`);
    return;
  }

  // Build the element node that matches the renderer's expected format
  const elementNode = {
    type: 'element' as const,
    elementType: island.type,
    content: island.children,
    props: island.props,
    children: [],
  };

  // Build the component tree with providers
  const componentElement = createElement(Component, { element: elementNode });
  const autoActiveWrapped = createElement(AutoActiveProvider, {
    screenId: providers.screenId,
    // biome-ignore lint/correctness/noChildrenProp: createElement API requires children as prop
    children: componentElement,
  });
  const fullyWrapped = createElement(InteractionProvider, {
    initialScreen: providers.screenId,
    screenUrls: providers.screenUrls,
    // biome-ignore lint/correctness/noChildrenProp: createElement API requires children as prop
    children: autoActiveWrapped,
  });

  // Hydrate the island
  hydrateRoot(island.container, fullyWrapped);
}

/**
 * Hydrate all islands on the page
 *
 * This is the main entry point called after DOMContentLoaded.
 */
export function hydrateIslands(): void {
  const data = window.__WIRESCRIPT_DATA__;

  if (!data) {
    console.warn('[WireScript] No __WIRESCRIPT_DATA__ found, hydration skipped');
    return;
  }

  const screenUrls: Record<string, string> = {};
  for (const screen of data.screens) {
    screenUrls[screen.id] = screen.url;
  }

  const islands = findIslands();

  if (islands.length === 0) {
    return; // No islands to hydrate
  }

  const providers = {
    screenId: data.currentScreen,
    screenUrls,
  };

  for (const island of islands) {
    try {
      hydrateIsland(island, providers);
    } catch (error) {
      console.error(`[WireScript] Failed to hydrate island ${island.type}:`, error);
    }
  }
}

/**
 * Initialize hydration when DOM is ready
 */
export function initHydration(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateIslands);
  } else {
    hydrateIslands();
  }
}
