# Chrome Web Store Listing

This document contains all the content needed for the Chrome Web Store submission.

---

## Basic Information

**Name:** WireScript

**Short Description (132 characters max):**
```
Renders WireScript code blocks as interactive wireframe previews on GitHub. Click to interact or view source.
```
(111 characters)

**Category:** Developer Tools

**Language:** English

---

## Detailed Description

```
WireScript for GitHub transforms WireScript code blocks in GitHub markdown files into interactive wireframe previews.

WHAT IS WIRESCRIPT?
WireScript is a markup language for describing UI wireframes. It uses a simple, readable syntax to define screens, layouts, and components. This extension brings those wireframes to life directly on GitHub.

HOW IT WORKS:
• Automatically detects code blocks with 'wire' or 'wirescript' language tags
• Shows a clickable preview of the wireframe
• Click to activate the full interactive wireframe
• Toggle between wireframe view and source code with one click
• View wireframes in fullscreen mode for detailed inspection
• Supports multi-screen wireframes with tab navigation

USE CASES:
• Preview UI designs without running any code
• Share interactive wireframes in README files
• Document component libraries and design systems visually
• Review UI specifications in pull requests
• Create living documentation for your projects

FEATURES:
• Zero configuration required - just install and it works
• Lightweight and fast - renders only when you click
• Respects viewport settings (mobile, tablet, desktop)
• Automatic deactivation when scrolling away to save resources
• PNG preview caching for faster subsequent loads
• Works on any public or private GitHub repository

PRIVACY:
• All processing happens locally in your browser
• No data is sent to external servers
• No tracking, analytics, or cookies
• No account required
• Open source - review the code yourself

PERMISSIONS EXPLAINED:
This extension requires access to github.com pages to detect WireScript code blocks and render them as wireframes. It does not access any other websites or send data anywhere.

SUPPORT:
For bug reports, feature requests, or questions, please visit the project's GitHub repository.
```

---

## Permission Justifications

### Host Permission: github.com

**Justification for Chrome Web Store submission:**

```
This extension needs access to github.com to detect and render WireScript code blocks in markdown files.

Specifically, the extension:
1. Scans GitHub pages for code blocks with 'wire' or 'wirescript' language tags
2. Reads the code content from the page DOM
3. Renders interactive wireframe previews in place of the code blocks

All processing happens locally in the browser. No data is transmitted to external servers. The extension only activates on GitHub pages and does not access any other websites.

This is the minimum permission required for the extension to function.
```

---

## Screenshots Required

Create screenshots at **1280x800** or **640x400** resolution showing:

1. **Before/After** - A GitHub README with a WireScript code block, showing the rendered wireframe preview

2. **Interactive Mode** - The wireframe in active/interactive state with the header bar visible

3. **Fullscreen Mode** - A wireframe displayed in fullscreen overlay

4. **Code Toggle** - Showing the toggle between wireframe and source code views

5. **Multi-Screen** - A wireframe with multiple screens showing the tab navigation

### Screenshot Captions:

1. "WireScript code blocks automatically render as wireframe previews"
2. "Click to interact with the wireframe - supports buttons, tabs, and navigation"
3. "Fullscreen mode for detailed wireframe inspection"
4. "Toggle between wireframe and source code with one click"
5. "Multi-screen wireframes with built-in navigation"

---

## Store Icon

The 128x128 icon is located at: `icons/icon-128.png`

---

## Additional Store Settings

**Website:** https://github.com/ruiyangke/wirescript

**Privacy Policy URL:** https://github.com/ruiyangke/wirescript/blob/main/apps/chrome-extension/PRIVACY_POLICY.md

**Support URL:** https://github.com/ruiyangke/wirescript/issues

**Pricing:** Free

**Visibility:** Public

**Mature Content:** No

**Google Analytics ID:** None (we don't track users)

---

## Review Notes for Google

```
This extension is a developer tool that renders a specific markup language (WireScript) as UI wireframe previews on GitHub.

Key points for review:
- Single, narrow purpose: render WireScript code blocks as wireframes
- All code is bundled locally, no remote code execution
- No user data collection or transmission
- No external API calls
- Minimal permissions (only github.com host access)
- Open source project

The extension only activates when it finds code blocks specifically tagged with 'wire' or 'wirescript' language identifiers. It does not modify any other page content.
```

---

## Checklist Before Submission

- [ ] Icons uploaded (16x16, 48x48, 128x128)
- [ ] At least 1 screenshot uploaded (1280x800 or 640x400)
- [ ] Detailed description filled in
- [ ] Privacy policy URL provided
- [ ] Permission justifications written
- [ ] Category selected (Developer Tools)
- [ ] Pricing set to Free
- [ ] Extension ZIP file uploaded
- [ ] Tested on multiple GitHub pages
