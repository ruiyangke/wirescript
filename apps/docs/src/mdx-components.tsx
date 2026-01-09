import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { FlagsDisplay, PropsList, PropsTable } from './components/props-table';
import { WirePreview } from './components/wire-preview';

export function getMDXComponents(components?: Record<string, React.ComponentType<unknown>>) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    Step,
    Steps,
    Accordion,
    Accordions,
    WirePreview,
    PropsTable,
    PropsList,
    FlagsDisplay,
    ...components,
  };
}
