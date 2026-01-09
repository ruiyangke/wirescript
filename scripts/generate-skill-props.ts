#!/usr/bin/env npx tsx
/**
 * Generate and update SKILL.md properties documentation from schemas.json
 *
 * Usage:
 *   npx tsx scripts/generate-skill-props.ts          # Update SKILL.md
 *   npx tsx scripts/generate-skill-props.ts --dry    # Print without updating
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '../packages/dsl/dist/schemas.json');
const SKILL_PATH = path.join(__dirname, '../packages/claude-plugin/skills/wirescript/SKILL.md');

const dryRun = process.argv.includes('--dry');

// Load schema
const schemas = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
type ElementSchema = {
  type: string;
  content: boolean;
  children: boolean;
  props: Record<string, { type: string; default?: unknown }>;
};
const elements = schemas.elements as Record<string, ElementSchema>;

// Generate the properties markdown section
function generatePropsSection(): string {
  return `## Common Properties

These property groups are shared across elements. Use them based on element type.

### Container Props
Most containers (\`box\`, \`card\`, \`section\`, \`header\`, \`footer\`, \`nav\`, \`form\`, \`list\`, \`scroll\`, \`group\`, \`tabs\`, \`breadcrumb\`, \`skeleton\`) support:

| Group | Props |
|-------|-------|
| Layout | \`:row\` \`:col\` \`:grid\` \`:wrap\` |
| Alignment | \`:start\` \`:center\` \`:end\` \`:between\` \`:around\` \`:stretch\` |
| Sizing | \`:full\` \`:fit\` \`:fill\` |
| Spacing | \`:gap N\` \`:padding N\` |
| Dimensions | \`:width "..."\` \`:height "..."\` |
| Position | \`:sticky\` \`:fixed\` \`:absolute\` \`:relative\` \`:top N\` \`:left N\` \`:right N\` \`:bottom N\` |

### Variant Props
Styled elements (\`box\`, \`card\`, \`button\`, \`badge\`, \`text\`, \`icon\`, \`metric\`, \`progress\`, \`toast\`, \`dropdown\`) support:

\`:primary\` \`:secondary\` \`:ghost\` \`:danger\` \`:success\` \`:warning\` \`:info\`

### Emphasis Props
Text-like elements (\`text\`, \`icon\`, \`avatar\`) support:

\`:high\` (large/bold) · \`:medium\` (default) · \`:low\` (small/muted)

### State Props
Interactive elements support (varies by element):

\`:disabled\` · \`:loading\` · \`:active\` · \`:checked\` · \`:error\` · \`:open\`

### Navigation Prop
Clickable elements (\`button\`, \`text\`, \`icon\`, \`image\`, \`avatar\`, \`tab\`, \`crumb\`, \`box\`, \`card\`, \`form\`) support:

\`:to target\` — where target is:
- \`screen-id\` — navigate to screen
- \`"#overlay-id"\` — open modal/drawer/popover
- \`:close\` — close current overlay

---

## All Elements (${Object.keys(elements).length})

### Containers (10)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`box\` | Flex/grid container | \`:cols N\` \`:rows N\` (grid mode) |
| \`card\` | Bordered container | — |
| \`section\` | Semantic section | \`:title "..."\` · content = section name |
| \`header\` | Page header (bottom border) | — |
| \`footer\` | Page footer (top border) | — |
| \`nav\` | Navigation container | — |
| \`form\` | Form container | — |
| \`list\` | List container | — |
| \`scroll\` | Scrollable container | requires \`:height\` |
| \`group\` | Input group | — |

### Content (6)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`text\` | Text display | content = displayed text |
| \`icon\` | Icon display | content = icon name · \`:size N\` |
| \`image\` | Image placeholder | content = alt text · \`:src "..."\` |
| \`avatar\` | User avatar | content = name/initials · \`:src "..."\` \`:size N\` |
| \`badge\` | Small label | content = badge text · \`:value "..."\` |
| \`divider\` | Horizontal line | — |

### Interactive (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`button\` | Clickable button | content = label · \`:icon "..."\` \`:disabled\` \`:loading\` \`:active\` |
| \`dropdown\` | Dropdown menu | content = trigger label · children = menu items · \`:open\` |
| \`input\` | Form input | content = **label** · see Input Types below |
| \`datepicker\` | Date picker | \`:value "YYYY-MM-DD"\` \`:placeholder "..."\` \`:disabled\` \`:error\` |

### Input Types

\`\`\`lisp
(input "Email" :type email :placeholder "you@example.com")
(input "Bio" :type textarea :rows 4)
(input "Country" :type select :options "US,CA,UK")
(input "Plan" :type radio :options "Free,Pro")
(input "Remember" :type checkbox :checked)
(input "Notify" :type toggle :on)
(input "Price" :type slider :min 0 :max 1000)
\`\`\`

**Types:** \`text\` \`email\` \`password\` \`search\` \`tel\` \`url\` \`number\` \`textarea\` \`select\` \`radio\` \`checkbox\` \`toggle\` \`slider\` \`date\` \`time\` \`color\` \`file\`

**Props:** \`:type\` \`:placeholder\` \`:value\` \`:options\` \`:min\` \`:max\` \`:step\` \`:rows\` \`:disabled\` \`:error\` \`:checked\` \`:on\`

### Data (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`metric\` | KPI display | \`:label "..."\` \`:value "..."\` \`:change "+12%"\` \`:trend up/down\` |
| \`chart\` | Chart placeholder | content = title · \`:type line/bar/pie/area/donut\` |
| \`progress\` | Progress bar | \`:value N\` \`:max N\` |
| \`skeleton\` | Loading placeholder | \`:circle\` \`:text\` |

### Navigation (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`tabs\` | Tab container | children = \`tab\` elements |
| \`tab\` | Tab item | content = label · \`:active\` \`:disabled\` \`:to target\` |
| \`breadcrumb\` | Breadcrumb container | children = \`crumb\` elements |
| \`crumb\` | Breadcrumb item | content = label · \`:active\` \`:to target\` |

### Overlays (3)

**All require \`:id "..."\`** for targeting with \`:to "#id"\`

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`modal\` | Centered dialog | \`:title "..."\` \`:width\` |
| \`drawer\` | Side panel | \`:left\` \`:right\` \`:top\` \`:bottom\` \`:width\` |
| \`popover\` | Attached popup | \`:top\` \`:bottom\` \`:left\` \`:right\` |

\`\`\`lisp
; Trigger
(button "Open" :to "#my-modal")

; Definition (at end of screen)
(modal :id "my-modal"
  (box :col :gap 16 :padding 24
    (text "Title" :high)
    (button "Close" :ghost :to :close)))
\`\`\`

### Utility (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| \`tooltip\` | Hover tip | content = tip text · child = trigger element |
| \`toast\` | Notification | content = message · \`:success\` \`:danger\` \`:loading\` |
| \`empty\` | Empty state | content = message · \`:icon "..."\` · children = action buttons |
| \`slot\` | Layout placeholder | used in \`layout\` definitions only |

---

## Icons

Common icon names (Lucide icons):

**Navigation:** \`menu\` \`home\` \`arrow-left\` \`arrow-right\` \`chevron-down\` \`chevron-right\` \`x\`

**Actions:** \`plus\` \`minus\` \`edit\` \`delete\` \`trash\` \`save\` \`copy\` \`download\` \`upload\` \`refresh-cw\` \`search\` \`filter\` \`sort\`

**Status:** \`check\` \`x\` \`alert-circle\` \`info\` \`bell\` \`clock\` \`calendar\`

**Objects:** \`user\` \`users\` \`settings\` \`mail\` \`phone\` \`lock\` \`eye\` \`star\` \`heart\` \`folder\` \`file\` \`image\` \`link\`

---

`;
}

// Update SKILL.md
function updateSkillMd(newSection: string): void {
  const content = fs.readFileSync(SKILL_PATH, 'utf-8');
  const lines = content.split('\n');

  // Find section boundaries
  const startMarker = lines.findIndex(
    (l) => l.startsWith('## Common Properties') || l.startsWith('## All Elements')
  );
  const endMarker = lines.findIndex((l, i) => i > startMarker && l === '## Components');

  if (startMarker === -1 || endMarker === -1) {
    console.error('Could not find section markers in SKILL.md');
    console.error('Looking for "## Common Properties" or "## All Elements" ... "## Components"');
    process.exit(1);
  }

  // Build new content
  const before = lines.slice(0, startMarker).join('\n');
  const after = lines.slice(endMarker).join('\n');
  const newContent = before + newSection + after;

  if (dryRun) {
    console.log('=== Generated Section ===\n');
    console.log(newSection);
    console.log('=== Would replace lines', startMarker + 1, 'to', endMarker, '===');
  } else {
    fs.writeFileSync(SKILL_PATH, newContent);
    console.log(`Updated SKILL.md`);
    console.log(
      `  Replaced lines ${startMarker + 1}-${endMarker} (${endMarker - startMarker} lines)`
    );
    console.log(`  New section: ${newSection.split('\n').length} lines`);
  }
}

// Main
const section = generatePropsSection();
updateSkillMd(section);
