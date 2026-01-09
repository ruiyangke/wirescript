import type { ComponentDef } from '@wirescript/dsl';
import { createContext, type ReactNode, useContext } from 'react';

interface ComponentsContextValue {
  components: Map<string, ComponentDef>;
}

const ComponentsContext = createContext<ComponentsContextValue>({
  components: new Map(),
});

interface ComponentsProviderProps {
  components: ComponentDef[];
  children: ReactNode;
}

export function ComponentsProvider({ components, children }: ComponentsProviderProps) {
  const componentsMap = new Map<string, ComponentDef>();
  for (const comp of components) {
    componentsMap.set(comp.name, comp);
  }

  return (
    <ComponentsContext.Provider value={{ components: componentsMap }}>
      {children}
    </ComponentsContext.Provider>
  );
}

export function useComponents() {
  return useContext(ComponentsContext);
}

export function useComponentDef(name: string): ComponentDef | undefined {
  const { components } = useComponents();
  return components.get(name);
}
