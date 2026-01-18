# WireScript for GitHub

Browser extension that renders WireScript wireframes directly on GitHub.

## Features

- 🎨 **Interactive Previews**: View wireframes with live interactions
- 📁 **Multi-File Support**: Automatically resolves `(include)` directives
- ⚡ **Smart Loading**: Lazy loads previews for better performance
- 📸 **PNG Export**: Generate static previews
- 🎭 **Modal & Drawer Support**: Test overlay interactions

## Installation

Install from the Chrome Web Store (coming soon) or load unpacked:

1. Clone the repository
2. Run `npm install` and `npm run build` in `apps/chrome-extension`
3. Open Chrome Extensions (chrome://extensions/)
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `dist` folder

## Usage

### Basic

View any `.wire` file on GitHub and the extension will automatically render interactive previews of WireScript code blocks.

### Multi-File Projects

The extension supports the `(include)` directive for modular wireframe projects:

```wire
; main.wire
(wire
  (include "components.wire")
  (include "layouts.wire")

  (screen home "Home" :layout app-layout
    (my-button :label "Click me")))
```

The extension automatically:
1. Detects includes in your code
2. Fetches included files from the same GitHub directory
3. Merges components, layouts, and screens
4. Renders the complete wireframe

## GitHub API Rate Limits

The extension uses the GitHub API to fetch included files for multi-file projects.

### Unauthenticated Requests

- **Limit**: 60 requests per hour per IP address
- **Scope**: Applies to all unauthenticated API calls from your IP
- **Impact**: Each unique file view fetches directory contents once

### What This Means

- Viewing 60 different WireScript files with includes uses the full limit
- Files are cached during your browsing session
- Refreshing the same file doesn't re-fetch unless page reloads
- Limit resets every hour

### If You Hit the Limit

Options if you encounter rate limiting:
1. **Wait**: Limits reset after one hour
2. **GitHub Authentication**: Future versions may support authenticated requests (5,000/hour)
3. **Local Development**: Use VS Code or CLI tools for unlimited local usage

### Monitoring Usage

Check your rate limit status: https://api.github.com/rate_limit

## Privacy

All code parsing and rendering happens locally in your browser. The extension only makes network requests to GitHub's API to fetch included `.wire` files when using the `(include)` directive.

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for complete details.

## License

Apache-2.0

## Links

- [WireScript Documentation](https://wirescript.dev)
- [Report Issues](https://github.com/ruiyangke/wirescript/issues)
- [Source Code](https://github.com/ruiyangke/wirescript)
