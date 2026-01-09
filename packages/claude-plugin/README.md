# WireScript Claude Code Plugin

Claude Code plugin for WireScript DSL authoring.

## Features

- **Skill**: Auto-triggered guidance when working with `.wire` files
- **Hook**: Auto-validates wireframes on save

## Installation

```bash
# Add marketplace
/plugin marketplace add ruiyangke/wirescript

# Install plugin
/plugin install wirescript@wirescript-plugins

# For local development
claude --plugin-dir ./packages/claude-plugin
```

## Requirements

```bash
# WireScript CLI for validation
npm install -g @wirescript/cli

# jq for hook functionality (if not already installed)
# macOS: brew install jq
# Ubuntu/Debian: sudo apt install jq
# Windows: choco install jq
```

## How It Works

1. **Write wireframes** - Claude uses the skill to generate valid WireScript
2. **Auto-validate** - Hook runs `npx @wirescript/cli verify` on `.wire` file save
3. **Fix errors** - Claude sees validation output and corrects issues

## Structure

```
packages/claude-plugin/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest
├── skills/
│   └── wirescript/
│       └── SKILL.md      # Comprehensive WireScript guide
├── hooks/
│   └── hooks.json        # Auto-validation hook
└── README.md
```

## WireScript Quick Example

```lisp
(wire
  (meta :title "My App")
  (screen home "Home" :desktop
    (box :col :gap 16 :padding 24
      (text "Hello World" :high)
      (button "Get Started" :primary))))
```

## License

Apache-2.0
