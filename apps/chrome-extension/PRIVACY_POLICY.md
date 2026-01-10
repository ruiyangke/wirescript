# Privacy Policy for WireScript

**Last Updated:** January 2025

## Overview

WireScript for GitHub is a browser extension that renders WireScript markup language code blocks as interactive UI wireframe previews on GitHub. This privacy policy explains how the extension handles user data.

## Data Collection

**We do NOT collect, store, or transmit any user data.**

### What the Extension Accesses

The extension accesses the following data **locally in your browser only**:

- **GitHub Page Content**: The extension reads code blocks on GitHub pages that are marked with `wire` or `wirescript` language tags. Specifically, it reads:
  - The visible code block text content
  - The `data-snippet-clipboard-copy-content` DOM attribute that GitHub uses to store the raw code

  This is necessary to detect and render wireframe previews. The extension does NOT access your system clipboard.

### What the Extension Does NOT Do

- **No External Data Transmission**: All processing happens locally in your browser. No data is ever sent to external servers, APIs, or third parties.

- **No Analytics or Tracking**: The extension does not include any analytics, telemetry, or tracking mechanisms.

- **No Cookies**: The extension does not create, read, or modify any cookies.

- **No Persistent Storage**: The extension does not use localStorage, IndexedDB, or any persistent storage. Any cached data (such as PNG preview images) is stored only in memory and is cleared when the browser tab is closed.

- **No User Accounts**: The extension does not require or support user accounts or authentication.

- **No Personal Information**: The extension does not access, collect, or process any personal information.

## Permissions

The extension requires the following permissions:

- **Host Permission (github.com)**: Required to run the content script on GitHub pages to detect and render WireScript code blocks. The extension only activates on `https://github.com/*` URLs.

## Data Processing

All data processing occurs entirely within your browser:

1. The extension detects code blocks with `wire` or `wirescript` language tags
2. It parses the WireScript source code locally using bundled JavaScript
3. It renders the wireframe preview in an isolated iframe
4. Optional PNG previews are generated locally and cached in browser memory only

## Third-Party Services

This extension does not integrate with or send data to any third-party services.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on the project's GitHub repository.

## Open Source

This extension is open source. You can review the complete source code to verify these privacy claims.
