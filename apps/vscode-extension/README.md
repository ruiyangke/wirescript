# WireScript VSCode Extension

WireScript language support for Visual Studio Code with live preview.

## Features

- **Syntax Highlighting** - Full TextMate grammar for .wire files
- **Live Preview** - Real-time rendered preview with Ctrl+Shift+V (Cmd+Shift+V on Mac)
- **IntelliSense** - Autocomplete for elements, props, components, and screens
- **Diagnostics** - Real-time error highlighting
- **Document Outline** - Navigate screens, components, and layouts
- **Go to Definition** - Jump to component/layout/screen definitions
- **Hover Information** - Documentation on hover for elements and keywords
- **Format Document** - Auto-format .wire files

## Usage

1. Open a `.wire` file
2. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to open the preview panel
3. Edit your wireframe and see changes in real-time

## Commands

- `WireScript: Open Preview` - Open preview in current column
- `WireScript: Open Preview to Side` - Open preview in side column

## Development

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm build

# Watch for changes
pnpm watch

# Package the extension
pnpm package
```

## License

Apache-2.0
