import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { homeLayoutOptions } from '@/lib/layout.home';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <HomeLayout {...homeLayoutOptions()}>{children}</HomeLayout>;
}
