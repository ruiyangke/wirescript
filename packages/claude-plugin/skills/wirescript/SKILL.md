---
name: wirescript
description: |
  WireScript DSL for AI-native wireframe creation. Use when:
  - Creating or editing .wire files
  - Designing UI layouts, screens, or components
  - Generating wireframes from descriptions
  Triggers: wireframe, .wire, WireScript, UI layout, screen, prototype
allowed-tools: Read, Write, Grep, Glob, Bash
---

# WireScript Language Guide

WireScript is a Lisp-style DSL for rapid UI wireframe prototyping.

## Quick Start

```lisp
(wire
  (meta :title "My App")
  (screen home "Home" :desktop
    (box :col :gap 16 :padding 24
      (text "Hello World" :high)
      (button "Get Started" :primary))))
```

## Document Structure

```lisp
(wire
  (meta :title "..." :context ... :audience "...")

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

---

## Core Syntax

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

## All Elements (35)

### Containers (10)

#### `box`
Generic flex/grid container. The most common element.

```lisp
(box :col :gap 16 :padding 24 (text "Hello"))
(box :row :between :gap 8 (button "A") (button "B"))
(box :grid :cols 3 :gap 16 (card ...) (card ...) (card ...))
```

| Props | `:gap` `:padding` `:cols` `:rows` `:width` `:height` `:to` |
| Flags | `:row` `:col` `:grid` `:wrap` `:center` `:between` `:start` `:end` `:full` `:fill` |

#### `card`
Bordered/elevated container.

```lisp
(card :col :gap 12 :padding 16
  (text "Card Title" :high)
  (text "Card content" :low))
```

| Props | Same as `box` |
| Flags | Same as `box`, plus `:primary` `:danger` etc. for colored borders |

#### `section`
Semantic page section.

```lisp
(section "hero" :col :center :padding 48
  (text "Welcome" :high))
```

| Content | Section name/role (e.g., "hero", "features", "pricing") |
| Props | `:gap` `:padding` `:title` `:width` `:height` |

#### `header`
Page header with bottom border.

```lisp
(header :row :between :padding 16
  (text "Logo" :high)
  (button "Sign In" :primary))
```

| Props | `:gap` `:padding` `:width` `:height` |

#### `footer`
Page footer with top border.

```lisp
(footer :row :center :padding 24
  (text "© 2024 Company" :low))
```

| Props | `:gap` `:padding` `:width` `:height` |

#### `nav`
Navigation container with appropriate styling.

```lisp
(nav :col :gap 4 :padding 16 :width "240px"
  (button "Dashboard" :ghost :full :start :to dashboard)
  (button "Settings" :ghost :full :start :to settings))
```

| Props | `:gap` `:padding` `:width` `:height` |

#### `form`
Form container.

```lisp
(form :col :gap 16
  (input "Email" :type email)
  (input "Password" :type password)
  (button "Submit" :primary :full))
```

| Props | `:gap` `:padding` `:to` (for form action) |

#### `list`
List container.

```lisp
(list :col
  (box :row :padding 12 (text "Item 1"))
  (divider)
  (box :row :padding 12 (text "Item 2")))
```

| Props | `:gap` `:padding` |

#### `scroll`
Scrollable container.

```lisp
(scroll :col :height "300px"
  (repeat :count 20 :as "i"
    (text "Item ${i}")))
```

| Props | `:height` (required for scrolling) `:gap` `:padding` |

#### `group`
Input group container.

```lisp
(group :row
  (input :type text :placeholder "Search...")
  (button "Go" :primary))
```

| Props | `:gap` `:padding` |

---

### Content (10)

#### `text`
Text display.

```lisp
(text "Hello World")
(text "Heading" :high)
(text "Muted text" :low)
(text "Error" :danger)
(text "Click me" :primary :to settings)
```

| Content | Text to display (required) |
| Props | `:to` `:width` `:height` |
| Flags | `:high` `:medium` `:low` `:primary` `:danger` `:success` `:center` |

#### `button`
Clickable button.

```lisp
(button "Click Me")
(button "Primary" :primary)
(button "Delete" :danger)
(button "Cancel" :ghost)
(button "Loading..." :primary :loading :disabled)
(button "Navigate" :primary :to dashboard)
(button "Open Modal" :to "#my-modal")
```

| Content | Button label (required) |
| Props | `:to` `:width` `:height` |
| Flags | `:primary` `:secondary` `:ghost` `:danger` `:success` `:warning` `:disabled` `:loading` `:full` `:fit` `:active` |

#### `dropdown`
Inline dropdown menu. First child is trigger label, remaining children are menu items.

```lisp
(dropdown "Options"
  (button "Edit" :ghost)
  (button "Duplicate" :ghost)
  (divider)
  (button "Delete" :danger :ghost))

; In a row with other content
(box :row :between
  (text "Item" :medium)
  (dropdown
    (button "Edit" :ghost :icon "edit")
    (button "Delete" :danger :ghost :icon "trash")))
```

| Content | Trigger label (optional) |
| Props | `:gap` `:padding` `:width` |
| Flags | `:disabled` `:open` |
| Children | Menu items (buttons, dividers) |

#### `input`
Form input field. **Content is the label, not placeholder.**

```lisp
(input "Username")
(input "Email" :type email :placeholder "you@example.com")
(input "Password" :type password)
(input "Bio" :type textarea :rows 4)
(input "Country" :type select :options "US,CA,UK,AU")
(input "Plan" :type radio :options "Free,Pro,Enterprise")
(input "Remember me" :type checkbox)
(input "Notifications" :type toggle)
(input "Age" :type number :min 0 :max 120)
(input "Price" :type slider :min 0 :max 1000)
(input "Invalid field" :type email :error)
```

| Content | **Label text** (displayed above input) |
| Props | `:type` `:placeholder` `:value` `:options` `:min` `:max` `:step` `:width` `:height` |
| Flags | `:disabled` `:error` `:checked` `:on` `:full` |

**Input types:** `text` `email` `password` `search` `tel` `url` `number` `textarea` `select` `radio` `checkbox` `toggle` `slider` `date` `time` `color` `file`

#### `image`
Image placeholder.

```lisp
(image "Product photo")
(image "Hero banner" :width "100%" :height "300px")
```

| Content | Alt text description |
| Props | `:src` `:alt` `:width` `:height` |

#### `icon`
Icon display.

```lisp
(icon "search")
(icon "menu")
(icon "user")
(icon "settings")
(icon "chevron-down")
```

| Content | Icon name |
| Props | `:name` `:size` `:width` `:height` |

**Common icons:** `search` `menu` `user` `settings` `home` `edit` `delete` `plus` `minus` `check` `x` `chevron-down` `chevron-right` `arrow-left` `arrow-right` `mail` `phone` `calendar` `clock` `star` `heart` `share` `download` `upload` `filter` `sort` `bell` `lock` `eye` `folder` `file` `image` `video` `music` `link` `copy` `save` `refresh-cw` `log-out`

#### `divider`
Horizontal separator line.

```lisp
(divider)
```

| Props | `:width` `:height` |

#### `avatar`
User avatar display.

```lisp
(avatar "John Doe")
(avatar "JD")
```

| Content | Name or initials |
| Props | `:src` `:name` `:size` `:width` `:height` |

#### `badge`
Small label or tag.

```lisp
(badge "New")
(badge "3")
(badge "Pro" :primary)
(badge "Sold Out" :danger)
(badge "+12%" :success)
```

| Content | Badge text |
| Props | `:value` `:width` `:height` |
| Flags | `:primary` `:secondary` `:danger` `:success` `:warning` `:info` |

#### `datepicker`
Date selection input.

```lisp
(datepicker)
(datepicker :value "2024-01-15")
(datepicker :placeholder "Select date")
```

| Props | `:value` `:placeholder` `:width` `:height` |
| Flags | `:disabled` `:error` |

---

### Data (4)

#### `metric`
Statistics/KPI display.

```lisp
(metric :label "Total Users" :value "12,345")
(metric :label "Revenue" :value "$84,230" :change "+12.5%" :trend up)
(metric :label "Orders" :value "1,429" :change "-3.1%" :trend down)
```

| Props | `:label` `:value` `:change` `:trend` (up/down) `:width` `:height` |

#### `chart`
Chart placeholder.

```lisp
(chart "Monthly Revenue")
(chart "Sales by Region" :type bar :height "200px")
(chart "Market Share" :type pie)
(chart "Growth Trend" :type line :height "300px")
(chart "Distribution" :type donut)
(chart "Performance" :type area)
```

| Content | Chart title |
| Props | `:type` (line/bar/pie/area/donut) `:height` `:width` `:gap` `:padding` |

#### `progress`
Progress bar indicator.

```lisp
(progress)
(progress :value 75)
(progress :value 75 :max 100)
```

| Props | `:value` `:max` `:width` `:height` |
| Flags | `:primary` `:success` `:warning` `:danger` |

#### `skeleton`
Loading placeholder.

```lisp
(skeleton)
(skeleton :width "100%" :height "200px")
(skeleton :width "60%" :height "20px")
```

| Props | `:width` `:height` `:gap` `:padding` |

---

### Navigation (4)

#### `tabs`
Tab container.

```lisp
(tabs
  (tab "General" :active)
  (tab "Security")
  (tab "Notifications"))
```

| Props | `:gap` `:padding` |

#### `tab`
Single tab item.

```lisp
(tab "Tab Label")
(tab "Active Tab" :active)
(tab "Linked Tab" :to settings-tab)
```

| Content | Tab label (required) |
| Props | `:to` `:width` `:height` |
| Flags | `:active` `:disabled` |

#### `breadcrumb`
Breadcrumb trail container.

```lisp
(breadcrumb
  (crumb "Home" :to home)
  (crumb "Products" :to products)
  (crumb "Details" :active))
```

| Props | `:gap` `:padding` |

#### `crumb`
Single breadcrumb item.

```lisp
(crumb "Home" :to home)
(crumb "Current Page" :active)
```

| Content | Crumb label (required) |
| Props | `:to` `:width` `:height` |
| Flags | `:active` |

---

### Overlay (3)

#### `modal`
Modal dialog. **Requires `:id`.**

```lisp
; Trigger
(button "Open Modal" :to "#my-modal")

; Modal definition (at end of screen)
(modal :id "my-modal"
  (box :col :gap 16 :padding 24
    (text "Modal Title" :high)
    (text "Modal content goes here." :low)
    (box :row :gap 12 :end
      (button "Cancel" :ghost :to :close)
      (button "Confirm" :primary))))
```

| Props | `:id` (required) `:title` `:gap` `:padding` `:width` `:height` |

#### `drawer`
Slide-out side panel. **Requires `:id`.**

```lisp
; Trigger
(button "Open Drawer" :to "#settings-drawer")

; Drawer definition
(drawer :id "settings-drawer" :right :width "400px"
  (box :col :gap 16 :padding 24
    (box :row :between
      (text "Settings" :high)
      (button "X" :ghost :to :close))
    (text "Drawer content...")))
```

| Props | `:id` (required) `:title` `:position` `:gap` `:padding` `:width` `:height` |
| Flags | `:left` `:right` `:top` `:bottom` |

#### `popover`
Popover content panel. **Requires `:id`.**

```lisp
; Trigger
(button "Info" :ghost :to "#help-popover")

; Popover definition
(popover :id "help-popover"
  (text "Helpful information here" :low))
```

| Props | `:id` (required) `:gap` `:padding` `:width` `:height` |
| Flags | `:top` `:bottom` `:left` `:right` |

---

### Utility (3)

#### `tooltip`
Hover tooltip. Wraps trigger element.

```lisp
(tooltip "Click to copy"
  (button "Copy" :ghost))

(tooltip "More information"
  (icon "info"))
```

| Content | Tip text (shown on hover) |
| Props | `:content` `:width` `:height` |
| Children | Element to wrap (the trigger) |

#### `toast`
Notification message.

```lisp
(toast "Changes saved successfully" :success)
(toast "Error occurred" :danger)
(toast "Please wait..." :info :loading)
```

| Content | Notification message |
| Props | `:message` `:duration` `:width` `:height` |
| Flags | `:success` `:danger` `:warning` `:info` `:loading` |

#### `empty`
Empty state display.

```lisp
(empty "No items found")
(empty "No results" :icon search)
(empty "No messages yet" :icon mail
  (button "Send First Message" :primary))
```

| Content | Empty state message |
| Props | `:message` `:icon` `:gap` `:padding` |
| Children | Optional action buttons |

---

### Layout (1)

#### `slot`
Placeholder for screen content in layouts. Must appear exactly once in each layout.

```lisp
(layout my-layout
  (box :row :full
    (nav :col :width "240px" ...)
    (slot)))  ; Screen content replaces this
```

---

## All Flags

### Layout
`:row` `:col` `:grid` `:wrap`

### Alignment
`:start` `:center` `:end` `:between` `:around` `:stretch`

### Emphasis
`:high` (large/bold) `:medium` (default) `:low` (small/muted)

### Variant
`:primary` `:secondary` `:ghost` `:danger` `:success` `:warning` `:info`

### State
`:disabled` `:loading` `:active` `:error` `:checked` `:on` `:open`

### Size
`:full` (full width) `:fit` (fit content) `:fill` (fill available)

### Position (for overlays)
`:top` `:bottom` `:left` `:right` `:sticky` `:fixed` `:absolute` `:relative`

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
