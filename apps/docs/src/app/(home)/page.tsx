import {
  ArrowRight,
  BookOpen,
  Bot,
  Braces,
  Chrome,
  Code2,
  ExternalLink,
  FileText,
  Layers,
  Repeat,
  Terminal,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { createHighlighter } from 'shiki';
import wireGrammar from '../../../wirescript.tmLanguage.json';

const codeExample = `(wire
  (screen login "Login" :mobile
    (box :col :center :gap 24 :padding 48
      (text "Welcome back" :high)
      (input "Email" :type email)
      (input "Password" :type password)
      (button "Sign In" :primary :full)
      (text "Forgot password?" :low))))`;

export default async function HomePage() {
  const highlighter = await createHighlighter({
    langs: [{ ...wireGrammar, name: 'wire' }],
    themes: ['catppuccin-latte', 'dracula'],
  });
  const highlightedCode = highlighter.codeToHtml(codeExample, {
    lang: 'wire',
    themes: { light: 'catppuccin-latte', dark: 'dracula' },
    defaultColor: false,
  });
  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center md:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fd-primary/10 via-transparent to-transparent" />

        <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary/50 px-4 py-1.5 text-sm text-fd-muted-foreground mb-6">
          <Code2 className="h-4 w-4" />
          <span>Lisp-like syntax for wireframes</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          Wireframes that live with <span className="text-fd-primary">your docs</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground md:text-xl">
          WireScript uses Lisp-like syntax that embeds into Markdown. Pure text. No HTML/CSS/JS.
          Perfect for AI to generate, easy for humans to iterate.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="https://playground.wirescript.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-secondary"
          >
            Try the Playground
          </Link>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="border-y border-fd-border bg-fd-secondary/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Embed wireframes in Markdown</h2>
              <p className="mt-4 text-fd-muted-foreground">
                Drop WireScript into any{' '}
                <code className="rounded bg-fd-secondary px-1.5 py-0.5 text-sm">.md</code> file. No
                build step, no external tools. Version control your UI alongside your specs.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-fd-primary/10 p-1">
                    <FileText className="h-3 w-3 text-fd-primary" />
                  </div>
                  Pure text — diffs, reviews, and merges just work
                </li>
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-fd-primary/10 p-1">
                    <Bot className="h-3 w-3 text-fd-primary" />
                  </div>
                  AI-native — LLMs generate it flawlessly
                </li>
                <li className="flex items-center gap-2">
                  <div className="rounded-full bg-fd-primary/10 p-1">
                    <Zap className="h-3 w-3 text-fd-primary" />
                  </div>
                  Zero distractions — focus on structure, not styling
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-fd-primary/20 to-transparent" />
              <div
                className="relative overflow-x-auto rounded-xl border border-fd-border text-sm [&>pre]:p-4 [&>pre]:!bg-fd-background"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering syntax-highlighted code
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Iterate fast. Stay focused.</h2>
            <p className="mt-4 text-fd-muted-foreground">
              No design tools. No context switching. Just text that renders into wireframes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="Lisp-like Syntax"
              description="S-expressions with intuitive flags. Minimal syntax, maximum clarity."
            />
            <FeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="Markdown Native"
              description="Embed in any .md file. Lives with your PRDs, specs, and documentation."
            />
            <FeatureCard
              icon={<Bot className="h-5 w-5" />}
              title="AI-First"
              description="Designed for LLMs. Ask AI to draw your wireframes — it just works."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Pure Text"
              description="No HTML, CSS, or JavaScript. Diffs are clean. Reviews are easy."
            />
            <FeatureCard
              icon={<Layers className="h-5 w-5" />}
              title="30+ Components"
              description="Containers, inputs, data displays, navigation, overlays — all built in."
            />
            <FeatureCard
              icon={<Repeat className="h-5 w-5" />}
              title="Reusable"
              description="Define layouts and components once. Use them across all your screens."
            />
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="border-t border-fd-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl">View wireframes everywhere</h2>
            <p className="mt-4 text-fd-muted-foreground">
              Render WireScript in VS Code, GitHub, Obsidian, or the command line.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* VS Code Extension */}
            <div className="rounded-xl border border-fd-border bg-fd-card p-6">
              <div className="flex items-start justify-between">
                <div className="inline-flex rounded-lg bg-fd-primary/10 p-2.5 text-fd-primary">
                  <Braces className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  Available
                </span>
              </div>
              <h3 className="mt-4 font-semibold">VS Code Extension</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Full language support with syntax highlighting, IntelliSense, live preview, and
                diagnostics.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=wirescript.wirescript"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-3 py-1.5 text-xs font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
                >
                  Install
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Link
                  href="/docs/tools/vscode-extension"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-secondary"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Chrome Extension */}
            <div className="rounded-xl border border-fd-border bg-fd-card p-6">
              <div className="flex items-start justify-between">
                <div className="inline-flex rounded-lg bg-fd-primary/10 p-2.5 text-fd-primary">
                  <Chrome className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  Available
                </span>
              </div>
              <h3 className="mt-4 font-semibold">Chrome Extension</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Renders wireframes inline in GitHub READMEs, issues, and PRs. Click to interact,
                toggle code view, or go fullscreen.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://chromewebstore.google.com/detail/wirescript/pmekhhogjcdhbbnkmlolfidgnlhdicei"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-3 py-1.5 text-xs font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
                >
                  Install
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Link
                  href="/docs/tools/chrome-extension"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-secondary"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Obsidian Plugin */}
            <div className="rounded-xl border border-fd-border bg-fd-card p-6">
              <div className="flex items-start justify-between">
                <div className="inline-flex rounded-lg bg-fd-primary/10 p-2.5 text-fd-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Coming Soon
                </span>
              </div>
              <h3 className="mt-4 font-semibold">Obsidian Plugin</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Render wireframes inline in your Obsidian notes. Switch between screens, navigate
                overlays, and iterate alongside your thinking.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/docs/tools/obsidian-plugin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-secondary"
                >
                  Build from source
                </Link>
              </div>
            </div>

            {/* CLI */}
            <div className="rounded-xl border border-fd-border bg-fd-card p-6">
              <div className="flex items-start justify-between">
                <div className="inline-flex rounded-lg bg-fd-primary/10 p-2.5 text-fd-primary">
                  <Terminal className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  Available
                </span>
              </div>
              <h3 className="mt-4 font-semibold">CLI</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Validate, render, and build wireframes from the command line. Export to HTML or PNG,
                generate static documentation sites.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/docs/tools/cli"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-secondary"
                >
                  View documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-t border-fd-border bg-fd-secondary/30 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Start in 5 minutes</h2>
          <p className="mt-4 text-fd-muted-foreground">
            Learn the syntax. Embed in your docs. Let AI do the drawing.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            >
              Read the Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/components"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-secondary"
            >
              View Components
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-fd-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-fd-muted-foreground">
          <p>Built with WireScript. Open source and free to use.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:bg-fd-secondary/50">
      <div className="mb-4 inline-flex rounded-lg bg-fd-primary/10 p-2.5 text-fd-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-fd-muted-foreground">{description}</p>
    </div>
  );
}
