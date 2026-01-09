import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { SquareArrowOutUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function homeLayoutOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'WireScript',
    },
    githubUrl: 'https://github.com/ruiyangke/wirescript',
    links: [
      {
        text: 'Docs',
        url: '/docs',
      },
      {
        type: 'custom',
        children: (
          <a
            href="https://playground.wirescript.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            Playground
            <SquareArrowOutUpRight className="size-3" />
          </a>
        ) as ReactNode,
      },
    ],
  };
}
