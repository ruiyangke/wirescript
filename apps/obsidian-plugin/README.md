# WireScript Obsidian Plugin

Render WireScript wireframes directly in your Obsidian markdown notes.

## Features

- Render `wire` code blocks as interactive wireframes
- Switch between multiple screens
- Navigate between screens and open overlays
- Syntax highlighting and error display

## Installation

### Manual Installation

1. Build the plugin:
   ```bash
   cd apps/obsidian-plugin
   pnpm install
   pnpm build
   ```

2. Copy files to your Obsidian vault:
   ```bash
   mkdir -p /path/to/vault/.obsidian/plugins/wirescript
   cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/wirescript/
   ```

3. Reload Obsidian and enable the plugin in Settings → Community plugins

## Usage

Create a code block with the `wire` language identifier:

````markdown
```wire
(wire
  (meta :title "My App")

  (screen home "Home" :mobile
    (box :col :full :padding 24 :gap 16
      (text "Hello World" :high)
      (button "Click Me" :primary))))
```
````

The wireframe will be rendered inline in your note.

### Multiple Screens

If your wireframe has multiple screens, tabs will appear to switch between them:

````markdown
```wire
(wire
  (meta :title "Multi-Screen App")

  (screen home "Home" :mobile
    (box :col :center :full
      (text "Home Screen" :high)
      (button "Go to Settings" :to "settings")))

  (screen settings "Settings" :mobile
    (box :col :center :full
      (text "Settings" :high)
      (button "Back" :ghost :to "home"))))
```
````

### With Components

Define reusable components:

````markdown
```wire
(wire
  (meta :title "Components Example")

  (define task-item (title done)
    (box :row :between :padding 12
      (input :type checkbox :checked $done)
      (text $title :fill)))

  (screen tasks "Tasks" :mobile
    (box :col :full
      (header :row :padding 16
        (text "My Tasks" :high))
      (scroll :col :full :padding 16 :gap 8
        (task-item :title "Buy groceries" :done false)
        (task-item :title "Walk the dog" :done true)
        (task-item :title "Write docs" :done false)))))
```
````

## Development

```bash
# Watch mode for development
pnpm dev

# Production build
pnpm build

# Type checking
pnpm typecheck
```

## Troubleshooting

### Plugin doesn't load
- Make sure all three files (`main.js`, `manifest.json`, `styles.css`) are in the plugin folder
- Check the Obsidian console (Ctrl+Shift+I) for errors

### Wireframe doesn't render
- Check for syntax errors in your WireScript code
- Errors will be displayed in a red box with line numbers

### Styles look wrong
- Make sure `styles.css` is copied to the plugin folder
- Try reloading Obsidian
