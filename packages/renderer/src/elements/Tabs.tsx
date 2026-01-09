import type { ElementNode } from '@wirescript/dsl';
import { useState } from 'react';
import { useIsAutoActive } from '../AutoActiveContext.js';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { useInteraction } from '../InteractionContext.js';
import { hasFlag } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.js';

interface TabsProps {
  element: ElementNode;
}

export function Tabs({ element }: TabsProps) {
  const { children } = element;

  // Filter tab children (ElementNode with elementType === 'tab')
  const tabChildren = children.filter(
    (child): child is ElementNode => child.type === 'element' && child.elementType === 'tab'
  );

  // Get default tab (first one or one with :active flag)
  const defaultTab = tabChildren.find((t) => hasFlag(t.props, 'active')) || tabChildren[0];
  const defaultContent = typeof defaultTab?.content === 'string' ? defaultTab.content : '0';
  const [activeTab, setActiveTab] = useState(defaultContent);

  if (tabChildren.length === 0) {
    return null;
  }

  return (
    <ShadcnTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start">
        {tabChildren.map((tab, index) => {
          const tabContent = typeof tab.content === 'string' ? tab.content : '';
          const tabId = tabContent || String(index);
          return (
            <TabsTrigger key={`tab-trigger-${tabId}`} value={tabId}>
              {tabContent || `Tab ${index + 1}`}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {tabChildren.map((tab, index) => {
        const tabContent = typeof tab.content === 'string' ? tab.content : '';
        const tabId = tabContent || String(index);
        return (
          <TabsContent key={`tab-content-${tabId}`} value={tabId}>
            {tab.children.map((child, childIndex) => (
              <ElementRenderer key={generateElementKey(child, childIndex)} node={child} />
            ))}
          </TabsContent>
        );
      })}
    </ShadcnTabs>
  );
}

interface TabProps {
  element: ElementNode;
}

// Tab is handled by Tabs component, this is a fallback for standalone tabs
export function Tab({ element }: TabProps) {
  const { handleAction } = useInteraction();
  const isAutoActive = useIsAutoActive(element);
  const { props, content } = element;
  const isActive = hasFlag(props, 'active') || isAutoActive;
  const textContent = typeof content === 'string' ? content : '';

  // Get the 'to' property for navigation
  const toValue = props.to;

  const handleClick = () => {
    if (!toValue) return;

    if (typeof toValue === 'object' && 'type' in toValue) {
      switch (toValue.type) {
        case 'screen':
          handleAction(toValue.id);
          break;
        case 'overlay':
          handleAction(`#${toValue.id}`);
          break;
        case 'action':
          handleAction(`:${toValue.action}`);
          break;
        case 'url':
          window.open(toValue.url, '_blank');
          break;
      }
    } else if (typeof toValue === 'string') {
      handleAction(toValue);
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-2 font-medium cursor-pointer',
        isActive && 'border-b-2 border-primary text-primary',
        !isActive && 'text-muted-foreground hover:text-foreground'
      )}
      onClick={toValue ? handleClick : undefined}
    >
      {textContent}
    </div>
  );
}
