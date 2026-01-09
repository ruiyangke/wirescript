import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docsLayoutOptions } from '@/lib/layout.docs';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout tree={source.getPageTree()} {...docsLayoutOptions()}>
      {children}
    </DocsLayout>
  );
}
