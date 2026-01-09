/**
 * @wirescript/hydration
 *
 * Client-side hydration for WireScript islands architecture.
 * Used by SSG builds with --interactive flag.
 */

// Runtime
export {
  findIslands,
  hydrateIsland,
  hydrateIslands,
  initHydration,
  registerComponents,
  type IslandElement,
  type WireScriptData,
} from './runtime.js';

// Contexts
export {
  AutoActiveProvider,
  isAutoActive,
  useAutoActive,
} from './contexts/AutoActiveContext.js';

export {
  InteractionProvider,
  useInteraction,
} from './contexts/InteractionContext.js';
