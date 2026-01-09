import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { WirePreview } from './components/wire-preview';
import { PropsTable, PropsList, FlagsDisplay } from './components/props-table';

export function getMDXComponents(
  components?: Record<string, React.ComponentType<unknown>>
) {
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
