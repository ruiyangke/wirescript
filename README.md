# WireScript

**Lisp-like syntax for wireframes. Embeds in Markdown. Perfect for AI.**

```wire
(wire
  (screen login "Login" :mobile
    (box :center :gap 24 :padding 48
      (text "Welcome back" :high)
      (input "Email" :type email)
      (input "Password" :type password)
      (button "Sign In" :primary :full)
      (text "Forgot password?" :low))))
```

WireScript is a text-based DSL for describing UI wireframes. It's designed to be easy for humans to read and write, and trivial for AI to generate. Embed it in your markdown files and preview instantly.

## Features

- **Simple syntax** — S-expressions with intuitive flags and properties
- **35 UI elements** — Containers, inputs, data displays, navigation, overlays
- **Multi-screen flows** — Navigate between screens and open modals
- **Reusable components** — Define once, use everywhere with parameters
- **Shared layouts** — Common page structures with navigation highlighting
- **Markdown native** — Embed in any `.md` file with fenced code blocks
- **AI-friendly** — LLMs generate valid WireScript reliably

## Preview Tools

### Chrome Extension

Render WireScript wireframes directly on GitHub. View READMEs, issues, and PRs with interactive previews.

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/wirescript/pmekhhogjcdhbbnkmlolfidgnlhdicei)**

### Obsidian Plugin

Render wireframes inline in your Obsidian notes. Switch between screens and navigate overlays without leaving your editor.

Coming soon to community plugins. [Build from source](./apps/obsidian-plugin) today.

### Playground

Try WireScript in the browser without installing anything.

**[Open Playground](https://playground.wirescript.org)**

### CLI

Validate, render, and build wireframes from the command line.

```bash
# Validate a .wire file
wirescript verify app.wire

# Render to HTML
wirescript render app.wire > output.html

# Export to PNG (requires Playwright)
wirescript render app.wire -f png -o screenshot.png

# Build a static documentation site
wirescript build app.wire -o ./dist

# Format a .wire file
wirescript format app.wire
```

Install globally with `pnpm add -g @wirescript/cli` or use via `npx @wirescript/cli`.

## Quick Start

Embed WireScript in any markdown file:

````markdown
```wire
(box :gap 16 :padding 24
  (text "Hello World" :high)
  (button "Get Started" :primary))
```
````

Install the [Chrome Extension](https://chromewebstore.google.com/detail/wirescript/pmekhhogjcdhbbnkmlolfidgnlhdicei) to preview on GitHub, or use the [Playground](https://playground.wirescript.org) to experiment.

## Syntax Overview

```wire
(wire
  ; Define reusable components
  (define user-card (name role)
    (card :row :gap 12 :padding 16
      (avatar $name)
      (box
        (text $name)
        (text $role :low))))

  ; Define shared layouts
  (layout app-layout
    (box :row :full
      (nav :width "200px" :padding 16
        (button "Home" :ghost :to home)
        (button "Settings" :ghost :to settings))
      (slot)))

  ; Define screens
  (screen home "Home" :desktop :layout app-layout
    (box :padding 24 :gap 16
      (text "Welcome" :high)
      (user-card :name "Alice" :role "Designer"))))
```

### Elements

| Category | Elements |
|----------|----------|
| **Containers** | `box` `card` `section` `header` `footer` `nav` `form` `list` `scroll` `group` |
| **Content** | `text` `icon` `image` `avatar` `badge` `divider` |
| **Interactive** | `button` `dropdown` |
| **Inputs** | `input` `datepicker` |
| **Data** | `metric` `chart` `progress` `skeleton` |
| **Navigation** | `tabs` `tab` `breadcrumb` `crumb` |
| **Overlays** | `modal` `drawer` `popover` |
| **Utility** | `tooltip` `toast` `empty` `slot` |

### Flags

Boolean modifiers that change appearance or behavior:

```wire
(button "Submit" :primary :disabled)
```

| Type | Flags |
|------|-------|
| Layout | `:row` `:col` `:grid` `:wrap` |
| Alignment | `:start` `:center` `:end` `:between` |
| Emphasis | `:high` `:medium` `:low` |
| Variant | `:primary` `:ghost` `:danger` `:success` |
| Size | `:full` `:fit` `:fill` |
| State | `:disabled` `:checked` `:active` |

### Properties

Key-value pairs for configuration:

```wire
(box :gap 16 :padding 24 :width "300px")
```

| Property | Example |
|----------|---------|
| `:gap` | `:gap 16` |
| `:padding` | `:padding 24` |
| `:width` | `:width "250px"` |
| `:to` | `:to dashboard` or `:to #modal` |
| `:type` | `:type email` |

### Navigation

Link buttons to screens or overlays using `:to`:

```wire
; Navigate to a screen
(button "Dashboard" :to dashboard)

; Open an overlay (# prefix targets modal/drawer/popover by ID)
(button "Settings" :to #settings-modal)

; Close current overlay
(button "Cancel" :to :close)
```

## Examples

The `examples/` folder contains complete wireframes:

- `login-form.wire` — Authentication screens
- `dashboard.wire` — Admin dashboard with metrics
- `e-commerce.wire` — Product catalog and cart
- `messaging-app.wire` — Chat interface
- `task-manager.wire` — Kanban board
- `crm-system.wire` — Customer management
- `analytics-dashboard.wire` — Data visualization
- `settings-page.wire` — Settings forms
- `social-app.wire` — Social media feed
- `landing-page.wire` — Marketing page

## Documentation

Full documentation available at **[wirescript.dev](https://wirescript.dev)**

- [Getting Started](https://wirescript.dev/docs/getting-started) — Tutorial and basics
- [Components](https://wirescript.dev/docs/components) — All elements and properties
- [CLI](https://wirescript.dev/docs/tools/cli) — Command-line tools
- [Chrome Extension](https://wirescript.dev/docs/tools/chrome-extension) — GitHub integration
- [Obsidian Plugin](https://wirescript.dev/docs/tools/obsidian-plugin) — Note-taking integration

## Project Structure

```
wirescript/
├── apps/
│   ├── chrome-extension/   # Chrome extension for GitHub
│   ├── obsidian-plugin/    # Obsidian plugin
│   ├── playground/         # Web playground
│   ├── docs/               # Documentation site
│   ├── cli/                # Command-line tools
│   └── viewer/             # Electron viewer
├── packages/
│   ├── dsl/                # Parser and compiler
│   ├── renderer/           # React rendering engine
│   └── editor/             # CodeMirror editor
└── examples/               # Example .wire files
```

## Development

Prerequisites: Node.js 20+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Start the docs site
pnpm --filter docs dev

# Build Chrome extension
pnpm --filter @wirescript/chrome-extension build

# Build Obsidian plugin
pnpm --filter @wirescript/obsidian-plugin build
```

## License

Apache 2.0
