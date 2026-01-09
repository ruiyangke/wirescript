import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docsLayoutOptions } from '@/lib/layout.docs';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout tree={source.getPageTree()} {...docsLayoutOptions()}>
      {children}
    </DocsLayout>
  );
}
