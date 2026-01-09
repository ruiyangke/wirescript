/**
 * @wirescript/hydration
 *
 * Client-side hydration for WireScript islands architecture.
 * Used by SSG builds with --interactive flag.
 */

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
// Runtime
export {
  findIslands,
  hydrateIsland,
  hydrateIslands,
  type IslandElement,
  initHydration,
  registerComponents,
  type WireScriptData,
} from './runtime.js';
