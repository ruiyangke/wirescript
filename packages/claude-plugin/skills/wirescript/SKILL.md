---
name: wirescript
description: |
  WireScript DSL for AI-native wireframe creation. Use when:
  - Creating or editing .wire files
  - Designing UI layouts, screens, or components
  - Generating wireframes from descriptions
  Triggers: wireframe, .wire, WireScript, UI layout, screen, prototype
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# WireScript Language Guide

WireScript is a Lisp-like DSL for rapid UI wireframe prototyping.

## Quick Start

```lisp
(wire
  (meta :title "My App")
  (screen home "Home" :desktop
    (box :col :gap 16 :padding 24
      (text "Hello World" :high)
      (button "Get Started" :primary))))
```

---

## Wireframe Process

When asked to create a wireframe, follow this process:

### 1. Understand the Request
- What is the app/feature? (e-commerce, dashboard, social, etc.)
- Who are the users? (admin, customer, mobile user)
- What are the key flows? (login → browse → checkout)

### 2. Plan Screens
List the screens needed:
```
- login: Authentication
- home: Main dashboard/landing
- detail: Item/content view
- settings: User preferences
```

### 3. Choose Viewport
| Viewport | Use When |
|----------|----------|
| `:mobile` | Phone-first apps, simple flows |
| `:tablet` | Mixed use, moderate complexity |
| `:desktop` | Admin panels, data-heavy apps |

### 4. Identify Patterns
- **Shared navigation?** → Define a `layout`
- **Repeated UI blocks?** → Define `components`
- **Destructive actions?** → Use `modal` for confirmation
- **Forms/filters?** → Use `drawer` for slide-out panels

### 5. Build in Order
```lisp
(wire
  (meta ...)           ; 1. Metadata
  (define ...)         ; 2. Reusable components
  (layout ...)         ; 3. Shared layouts
  (screen ... ))       ; 4. Screens with overlays
```

### 6. Validate
```bash
npx @wirescript/cli verify <file.wire>
```

---

## Decision Framework

### Container Selection
| Need | Use |
|------|-----|
| Generic flex/grid layout | `box` |
| Elevated/bordered content | `card` |
| Page header with border | `header` |
| Page footer with border | `footer` |
| Navigation links | `nav` |
| Form inputs grouped | `form` |
| Scrollable content | `scroll` |
| Input + button together | `group` |

### Overlay Selection
| Need | Use |
|------|-----|
| Confirmation dialog | `modal` - centered, blocks interaction |
| Side panel (settings, filters) | `drawer` - slides from edge |
| Quick info on hover/click | `popover` - attached to trigger |

### Input Types
| Data | Type |
|------|------|
| Short text | `text` (default) |
| Email address | `email` |
| Password | `password` |
| Long text | `textarea` |
| Yes/no toggle | `toggle` or `checkbox` |
| One of many | `radio` or `select` |
| Date | `date` or use `datepicker` |
| Numeric range | `slider` |

### Screen Definition
```lisp
(screen screen-id "Display Title" :viewport :layout layout-name
  (content ...)
  (modal :id "..." ...)
  (drawer :id "..." ...))
```

| Part | Required | Example |
|------|----------|---------|
| `screen-id` | Yes | `home`, `user-profile`, `checkout` |
| `"Title"` | Yes | `"Home"`, `"User Profile"` |
| `:viewport` | Yes | `:mobile`, `:tablet`, `:desktop` |
| `:layout` | No | `:layout app-layout` |

---

## Complete Example

A task management app with multiple screens, shared layout, and overlays:

```lisp
(wire
  (meta :title "TaskFlow" :context "Team task management" :audience "Desktop users")

  ; Reusable components
  (define task-card (title status assignee)
    (card :row :between :padding 12
      (box :row :gap 12
        (input :type checkbox)
        (box :col :gap 4
          (text $title)
          (text $assignee :low)))
      (badge $status)))

  (define stat-card (icon label value)
    (card :col :gap 8 :padding 16
      (box :row :between
        (icon $icon)
        (icon "more-horizontal"))
      (text $value :high)
      (text $label :low)))

  ; Shared layout with sidebar navigation
  (layout app-layout
    (box :row :full
      (nav :col :width "240px" :padding 16 :gap 4
        (text "TaskFlow" :high)
        (divider)
        (button "Dashboard" :ghost :full :start :to dashboard)
        (button "My Tasks" :ghost :full :start :to tasks)
        (button "Team" :ghost :full :start :to team)
        (box :fill)
        (divider)
        (box :row :gap 12
          (avatar "JD")
          (box :col
            (text "John Doe")
            (text "Admin" :low))))
      (slot)))

  ; Dashboard screen
  (screen dashboard "Dashboard" :desktop :layout app-layout
    (box :col :gap 24 :padding 24
      (box :row :between
        (text "Dashboard" :high)
        (button "New Task" :primary :to "#new-task"))

      ; Stats row
      (box :row :gap 16
        (stat-card :icon "check-circle" :label "Completed" :value "24")
        (stat-card :icon "clock" :label "In Progress" :value "12")
        (stat-card :icon "alert-circle" :label "Overdue" :value "3"))

      ; Recent tasks
      (box :col :gap 16
        (box :row :between
          (text "Recent Tasks" :medium)
          (button "View All" :ghost :to tasks))
        (task-card :title "Review design specs" :status "In Progress" :assignee "Alice")
        (task-card :title "Update API docs" :status "Todo" :assignee "Bob")
        (task-card :title "Fix login bug" :status "Done" :assignee "Carol")))

    ; New task modal
    (modal :id "new-task"
      (box :col :gap 16 :padding 24 :width "400px"
        (text "Create New Task" :high)
        (input "Title" :placeholder "Task title...")
        (input "Description" :type textarea :rows 3)
        (input "Assignee" :type select :options "Alice,Bob,Carol")
        (input "Priority" :type radio :options "Low,Medium,High")
        (box :row :gap 12 :end
          (button "Cancel" :ghost :to :close)
          (button "Create" :primary)))))

  ; Tasks screen
  (screen tasks "My Tasks" :desktop :layout app-layout
    (box :col :gap 16 :padding 24
      (box :row :between
        (text "My Tasks" :high)
        (box :row :gap 8
          (button "Filter" :ghost :to "#filter-drawer")
          (button "New Task" :primary :to "#new-task")))

      (tabs
        (tab "All" :active)
        (tab "In Progress")
        (tab "Completed"))

      (scroll :height "calc(100vh - 200px)"
        (box :col :gap 8
          (repeat :count 10 :as "i"
            (task-card :title "Task ${i}" :status "Todo" :assignee "You")))))

    ; Filter drawer
    (drawer :id "filter-drawer" :right :width "320px"
      (box :col :gap 16 :padding 24
        (box :row :between
          (text "Filters" :high)
          (button "X" :ghost :to :close))
        (input "Status" :type select :options "All,Todo,In Progress,Done")
        (input "Priority" :type select :options "All,Low,Medium,High")
        (input "Assignee" :type select :options "All,Alice,Bob,Carol")
        (box :row :gap 12
          (button "Reset" :ghost :full)
          (button "Apply" :primary :full)))))

  ; Team screen
  (screen team "Team" :desktop :layout app-layout
    (box :col :gap 24 :padding 24
      (text "Team Members" :high)
      (box :grid :cols 3 :gap 16
        (repeat :count 6 :as "i"
          (card :col :center :gap 12 :padding 24
            (avatar "User ${i}")
            (text "Team Member ${i}")
            (text "Role" :low)
            (box :row :gap 8
              (badge "12 tasks")
              (badge "3 done" :success))))))))
```

This example demonstrates:
- **`meta`** for context
- **`define`** for reusable task-card and stat-card components
- **`layout`** with sidebar nav and auto-active highlighting
- **3 screens** sharing the same layout
- **`modal`** for task creation
- **`drawer`** for filters
- **`tabs`** for content filtering
- **`repeat`** for generating lists
- **`:to`** navigation between screens and overlays

## Document Structure

```lisp
(wire
  (meta :title "..." :context "..." :audience "...")

  ; 1. Component definitions
  (define component-name (param1 param2)
    (element ... $param1 ... $param2 ...))

  ; 2. Layout definitions
  (layout layout-name
    (box :row :full
      (nav ...)
      (slot)))  ; slot = where screen content goes

  ; 3. Screens
  (screen screen-id "Screen Name" :viewport :layout layout-name
    (content ...)

    ; Overlays at end of screen
    (modal :id "modal-id" ...)
    (drawer :id "drawer-id" ...)))
```

### `meta` (optional)

Document-level metadata for context:

```lisp
(meta :title "My App" :context "E-commerce platform" :audience "Mobile users")
```

| Props | `:title` `:context` `:audience` |

---

## Core Syntax

### Comments

Use semicolons for single-line comments:

```lisp
; This is a comment
(wire
  ; Define the login screen
  (screen login "Login" :mobile
    (text "Welcome")))  ; inline comment
```

### Argument Order (STRICT)

```
(type content? flags* props* children*)
```

| Position | What | Example |
|----------|------|---------|
| 1 | Element type | `button` |
| 2 | Content (optional) | `"Click me"` |
| 3+ | Flags (boolean) | `:primary :disabled` |
| N+ | Props (key-value) | `:to dashboard :gap 16` |
| Last | Children | `(text "child")` |

```lisp
(divider)                                  ; type only
(text "Hello")                             ; type + content
(button "Submit" :primary)                 ; + flag
(button "Go" :primary :to dashboard)       ; + prop
(box :row :gap 16 (text "A") (text "B"))   ; + children
```

### Flags vs Properties

Same `:keyword` token - context determines meaning:

```lisp
(button "Submit" :primary :disabled :to checkout)
;                 ↑        ↑         ↑
;                 flag     flag      property (has value)
```

### Content by Element

| Element | Content meaning |
|---------|-----------------|
| `text` | Displayed text |
| `button` | Button label |
| `input` | **Label** (NOT placeholder) |
| `icon` | Icon name ("search", "menu", "user") |
| `image` | Alt text description |
| `avatar` | Name or initials |
| `badge` | Badge text |
| `section` | Section name/role |
| `chart` | Chart title |
| `tooltip` | Tip text (shown on hover) |
| `toast` | Notification message |
| `tab` | Tab label |
| `crumb` | Breadcrumb label |
| `empty` | Empty state message |

```lisp
; input: content = label, placeholder is separate
(input "Email Address" :type email :placeholder "you@example.com")
```

---
## Common Properties

These property groups are shared across elements. Use them based on element type.

### Container Props
Most containers (`box`, `card`, `section`, `header`, `footer`, `nav`, `form`, `list`, `scroll`, `group`, `tabs`, `breadcrumb`, `skeleton`) support:

| Group | Props |
|-------|-------|
| Layout | `:row` `:col` `:grid` `:wrap` |
| Alignment | `:start` `:center` `:end` `:between` `:around` `:stretch` |
| Sizing | `:full` `:fit` `:fill` |
| Spacing | `:gap N` `:padding N` |
| Dimensions | `:width "..."` `:height "..."` |
| Position | `:sticky` `:fixed` `:absolute` `:relative` `:top N` `:left N` `:right N` `:bottom N` |

### Variant Props
Styled elements (`box`, `card`, `button`, `badge`, `text`, `icon`, `metric`, `progress`, `toast`, `dropdown`) support:

`:primary` `:secondary` `:ghost` `:danger` `:success` `:warning` `:info`

### Emphasis Props
Text-like elements (`text`, `icon`, `avatar`) support:

`:high` (large/bold) · `:medium` (default) · `:low` (small/muted)

### State Props
Interactive elements support (varies by element):

`:disabled` · `:loading` · `:active` · `:checked` · `:error` · `:open`

### Navigation Prop
Clickable elements (`button`, `text`, `icon`, `image`, `avatar`, `tab`, `crumb`, `box`, `card`, `form`) support:

`:to target` — where target is:
- `screen-id` — navigate to screen
- `"#overlay-id"` — open modal/drawer/popover
- `:close` — close current overlay

---

## All Elements (32)

### Containers (10)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `box` | Flex/grid container | `:cols N` `:rows N` (grid mode) |
| `card` | Bordered container | — |
| `section` | Semantic section | `:title "..."` · content = section name |
| `header` | Page header (bottom border) | — |
| `footer` | Page footer (top border) | — |
| `nav` | Navigation container | — |
| `form` | Form container | — |
| `list` | List container | — |
| `scroll` | Scrollable container | requires `:height` |
| `group` | Input group | — |

### Content (6)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `text` | Text display | content = displayed text |
| `icon` | Icon display | content = icon name · `:size N` |
| `image` | Image placeholder | content = alt text · `:src "..."` |
| `avatar` | User avatar | content = name/initials · `:src "..."` `:size N` |
| `badge` | Small label | content = badge text · `:value "..."` |
| `divider` | Horizontal line | — |

### Interactive (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `button` | Clickable button | content = label · `:icon "..."` `:disabled` `:loading` `:active` |
| `dropdown` | Dropdown menu | content = trigger label · children = menu items · `:open` |
| `input` | Form input | content = **label** · see Input Types below |
| `datepicker` | Date picker | `:value "YYYY-MM-DD"` `:placeholder "..."` `:disabled` `:error` |

### Input Types

```lisp
(input "Email" :type email :placeholder "you@example.com")
(input "Bio" :type textarea :rows 4)
(input "Country" :type select :options "US,CA,UK")
(input "Plan" :type radio :options "Free,Pro")
(input "Remember" :type checkbox :checked)
(input "Notify" :type toggle :on)
(input "Price" :type slider :min 0 :max 1000)
```

**Types:** `text` `email` `password` `search` `tel` `url` `number` `textarea` `select` `radio` `checkbox` `toggle` `slider` `date` `time` `color` `file`

**Props:** `:type` `:placeholder` `:value` `:options` `:min` `:max` `:step` `:rows` `:disabled` `:error` `:checked` `:on`

### Data (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `metric` | KPI display | `:label "..."` `:value "..."` `:change "+12%"` `:trend up/down` |
| `chart` | Chart placeholder | content = title · `:type line/bar/pie/area/donut` |
| `progress` | Progress bar | `:value N` `:max N` |
| `skeleton` | Loading placeholder | `:circle` `:text` |

### Navigation (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `tabs` | Tab container | children = `tab` elements |
| `tab` | Tab item | content = label · `:active` `:disabled` `:to target` |
| `breadcrumb` | Breadcrumb container | children = `crumb` elements |
| `crumb` | Breadcrumb item | content = label · `:active` `:to target` |

### Overlays (3)

**All require `:id "..."`** for targeting with `:to "#id"`

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `modal` | Centered dialog | `:title "..."` `:width` |
| `drawer` | Side panel | `:left` `:right` `:top` `:bottom` `:width` |
| `popover` | Attached popup | `:top` `:bottom` `:left` `:right` |

```lisp
; Trigger
(button "Open" :to "#my-modal")

; Definition (at end of screen)
(modal :id "my-modal"
  (box :col :gap 16 :padding 24
    (text "Title" :high)
    (button "Close" :ghost :to :close)))
```

### Utility (4)

| Element | Description | Specific Props |
|---------|-------------|----------------|
| `tooltip` | Hover tip | content = tip text · child = trigger element |
| `toast` | Notification | content = message · `:success` `:danger` `:loading` |
| `empty` | Empty state | content = message · `:icon "..."` · children = action buttons |
| `slot` | Layout placeholder | used in `layout` definitions only |

---

## Icons

Common icon names (Lucide icons):

**Navigation:** `menu` `home` `arrow-left` `arrow-right` `chevron-down` `chevron-right` `x`

**Actions:** `plus` `minus` `edit` `delete` `trash` `save` `copy` `download` `upload` `refresh-cw` `search` `filter` `sort`

**Status:** `check` `x` `alert-circle` `info` `bell` `clock` `calendar`

**Objects:** `user` `users` `settings` `mail` `phone` `lock` `eye` `star` `heart` `folder` `file` `image` `link`

---

## Components

### Define
```lisp
(define stat-card (icon label value)
  (card :col :gap 8 :padding 16
    (icon $icon)
    (text $label :low)
    (text $value :high)))
```

### Use (always named arguments)
```lisp
(stat-card :icon "users" :label "Total Users" :value "1,234")
```

### Rules
- Use `$param` in body to reference parameters
- Calls MUST use `:keyword value` syntax (named args)
- Cannot shadow built-in element names

---

## Layouts

### Define with slot
```lisp
(layout sidebar-layout
  (box :row :full
    (nav :col :width "240px" :padding 16 :gap 4
      (text "App" :high)
      (divider)
      (button "Dashboard" :ghost :full :start :to dashboard)
      (button "Settings" :ghost :full :start :to settings))
    (slot)))
```

### Use in screen
```lisp
(screen dashboard "Dashboard" :desktop :layout sidebar-layout
  (box :col :padding 24
    (text "Welcome" :high)))
```

**Auto-active:** Buttons with `:to` matching current screen get `:active` styling automatically.

---

## Navigation

### Screen navigation
```lisp
(button "Dashboard" :to dashboard)        ; symbol = screen id
```

### Open overlay
```lisp
(button "Delete" :danger :to "#confirm")  ; string with # = overlay id
```

### Close overlay
```lisp
(button "Cancel" :ghost :to :close)       ; :close keyword = dismiss
```

---

## Repeat

```lisp
(repeat :count 5 :as "i"
  (text "Item ${i}"))

; Nested
(repeat :count 3 :as "row"
  (repeat :count 3 :as "col"
    (text "Cell ${row},${col}")))
```

---

## Common Patterns

### Sidebar Layout
```lisp
(layout app-layout
  (box :row :full
    (nav :col :width "240px" :padding 16 :gap 4
      (text "App Name" :high)
      (divider)
      (button "Home" :ghost :full :start :to home)
      (button "Settings" :ghost :full :start :to settings)
      (box :fill)
      (divider)
      (box :row :gap 12
        (avatar "User")
        (text "User Name" :low)))
    (slot)))
```

### Stat Cards
```lisp
(define stat-card (icon label value change)
  (card :col :gap 8 :padding 16
    (box :row :between
      (icon $icon)
      (badge $change))
    (text $label :low)
    (text $value :high)))

(box :row :gap 16
  (stat-card :icon "users" :label "Users" :value "1,234" :change "+12%")
  (stat-card :icon "dollar-sign" :label "Revenue" :value "$5.2K" :change "+8%"))
```

### Form
```lisp
(form :col :gap 16
  (box :col :gap 6
    (text "Email" :medium)
    (input :type email :placeholder "you@example.com"))
  (box :col :gap 6
    (text "Password" :medium)
    (input :type password :placeholder "Enter password"))
  (button "Sign In" :primary :full))
```

### Modal Confirmation
```lisp
(button "Delete" :danger :to "#confirm-delete")

(modal :id "confirm-delete"
  (box :col :gap 16 :padding 24
    (text "Delete Item?" :high)
    (text "This cannot be undone." :low)
    (box :row :gap 12 :end
      (button "Cancel" :ghost :to :close)
      (button "Delete" :danger))))
```

### Card Grid
```lisp
(box :grid :cols 3 :gap 16
  (repeat :count 6 :as "i"
    (card :col :gap 12 :padding 16
      (image "Product ${i}" :height "120px")
      (text "Product ${i}" :medium)
      (text "$99" :high)
      (button "Add to Cart" :primary :full))))
```

### Data Table
```lisp
(card :col :gap 0
  ; Header
  (box :row :padding 12
    (text "Name" :low :width "200px")
    (text "Email" :low :fill)
    (text "Role" :low :width "100px"))
  (divider)
  ; Rows
  (repeat :count 5 :as "i"
    (box :col
      (box :row :padding 12
        (text "User ${i}" :width "200px")
        (text "user${i}@example.com" :low :fill)
        (badge "Admin" :width "100px"))
      (divider))))
```

---

## Validation

After writing a `.wire` file, validate:

```bash
npx @wirescript/cli verify <file.wire>
```

### Common Errors

| Error | Fix |
|-------|-----|
| Unknown element type | Check spelling (35 valid types above) |
| Duplicate screen ID | Use unique IDs for each screen |
| Invalid :to reference | Target screen/overlay must exist |
| Missing slot in layout | Add `(slot)` to layout body |
| Unexpected token | Check parentheses balance, argument order |

---

## Best Practices

1. **Use semantic elements** - `nav` not `box` for navigation, `header`/`footer` for page structure
2. **Define components** for repeated patterns (3+ uses)
3. **Use layouts** for shared navigation across screens
4. **Add overlays** for confirmations, forms, and side panels
5. **Set viewport** - `:mobile`, `:tablet`, or `:desktop`
6. **Use emphasis** - `:high` for headings, `:low` for secondary text
7. **Validate** - Run `npx @wirescript/cli verify` after writing
