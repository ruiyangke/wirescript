import type { LayoutNode } from '@wirescript/dsl';
import { createContext, type ReactNode, useContext } from 'react';

interface LayoutsContextValue {
  layouts: Map<string, LayoutNode>;
}

const LayoutsContext = createContext<LayoutsContextValue>({
  layouts: new Map(),
});

interface LayoutsProviderProps {
  layouts: LayoutNode[];
  children: ReactNode;
}

export function LayoutsProvider({ layouts, children }: LayoutsProviderProps) {
  const layoutsMap = new Map<string, LayoutNode>();
  for (const layout of layouts) {
    layoutsMap.set(layout.name, layout);
  }

  return (
    <LayoutsContext.Provider value={{ layouts: layoutsMap }}>{children}</LayoutsContext.Provider>
  );
}

export function useLayouts() {
  return useContext(LayoutsContext);
}

export function useLayoutDef(name: string): LayoutNode | undefined {
  const { layouts } = useLayouts();
  return layouts.get(name);
}
