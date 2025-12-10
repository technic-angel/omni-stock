# Omni STOCK – UI Design Spec (Agent Guidelines, v2)

This document is for **AI coding agents** building Omni STOCK’s frontend using **React + shadcn/ui + TailwindCSS + Font Awesome**.

---

## 0. Hard vs. Soft Rules

### 🚫 Non-negotiable (HARD constraints)

Agents **must** follow these:

1. **Target audience**
   - App is for **collectors**:
     - Cards & games (TCG, retro games, etc.)
     - Fashion & beauty (bags, shoes, makeup, jewelry)
     - Toys & figures (Labubu, designer toys, etc.)
   - Visual vibe should:
     - Feel **fashion-forward and sleek enough for women to love**
     - Still be **neutral enough that nerdy guys will also use it**
     - That means: clean, modern, not overly pink/“girly”, no edgy gamer look.

2. **Color scheme (core brand)**
   - **Page background:** white  
     - `#FFFFFF` (or extremely close)
   - **Primary accent:** Tiffany / teal blue  
     - Use `#37C5B8` (or very close) as **brand.primary**.
   - **Secondary colors:** neutrals + teal variations only.
     - No random bright reds/purples/neons.
   - Status / soft colors must stay within:
     - Light blues/teals
     - Light grays
   - The **logo** (gem + “Omni STOCK”) must use the Tiffany-ish accent for the “STOCK” part.

3. **Responsive / mobile support**
   - **Site must be fully usable on mobile.**
   - The layout **must adapt gracefully** down to small screens (~320px).
   - At small widths:
     - **Only the gem logo icon should be visible in the header; hide the “Omni STOCK” wordmark text.**
     - Sidebar navigation must become a **slide-in drawer** (e.g., shadcn `Sheet`).
   - Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`, etc.) consistently.

### ✅ Flexible (SOFT guidelines)

Agents should **generally follow** these, but can adjust when needed:

- Exact card border radius values (`rounded-xl` vs `rounded-2xl`)
- Exact spacing (`px-4` vs `px-5`)
- Whether stats appear as 3 or 4 cards
- Exact icon choices from Font Awesome
- Exact copy text (“Total items” vs “Items total”, etc.)
- Precise breakpoints for layout changes, as long as:
  - Desktop looks like a clean dashboard.
  - Mobile is readable and not cramped.

If deviating from a soft guideline improves clarity, **that’s allowed**—but don’t violate the hard rules above.

---

## 1. Brand & Palette (HARD)

### Palette tokens

These are recommended tokens; agents must **stay within this family**:

```ts
brand.bg         = #FFFFFF   // main page background (HARD)
brand.surface    = #F9FBFB   // cards / panels
brand.surfaceAlt = #F3F7F7   // subtle alternate / hover
brand.border     = #E5EBEE   // dividers / card borders

brand.primary    = #37C5B8   // Tiffany blue accent (HARD)
brand.primarySoft= #E6F7F5   // chips, soft backgrounds
brand.primaryDark= #0F9A8C   // primary hover / pressed

text.main        = #0F172A   // headings
text.body        = #4B5563   // normal text
text.muted       = #6B7280   // secondary
text.subtle      = #9CA3AF   // meta labels

state.goodBg     = #E6F7F5   // "Very good", "Mint in box"
state.goodText   = #0F766E

state.newBg      = #E0F2FE   // "New"
state.newText    = #0369A1

table.headerBg   = #F3F7F7
```

Suggested Tailwind extension (soft guideline, but useful):

```ts
// tailwind.config.ts
extend: {
  colors: {
    brand: {
      bg: "#FFFFFF",
      surface: "#F9FBFB",
      surfaceAlt: "#F3F7F7",
      border: "#E5EBEE",
      primary: "#37C5B8",
      primarySoft: "#E6F7F5",
      primaryDark: "#0F9A8C",
    },
  },
}
```

---

## 2. Typography (soft)

- Use Tailwind `font-sans`.
- H1: `text-2xl md:text-3xl font-semibold text-slate-900`
- Body: `text-sm text-slate-600`
- Meta: `text-xs text-slate-500`

Headline style should feel **modern and editorial**, not playful.

---

## 3. Layout & Responsiveness

### 3.1 App Shell (desktop, soft guideline)

- Layout:
  - Optional sidebar on the left.
  - Main content with top navbar and dashboard panels.
- Use `max-w-6xl mx-auto` with `px-4 md:px-6` and `py-6 md:py-8`.
- Background: `bg-brand.bg`.

### 3.2 Sidebar behavior (HARD: responsive behavior)

**Desktop (≥ md)** – soft guideline for structure:

- Fixed width: `w-56`–`w-64`.
- Background: white.
- Right border: `border-r border-brand.border`.
- Contains:
  - Logo
  - Nav links: Dashboard, All items, Vendors, Grails & wishlist
  - At bottom: Log in / Log out actions.

**Mobile (< md)** – HARD requirements:

- Sidebar should NOT be permanently visible.
- Replace sidebar with:
  - A **hamburger icon** in the top-left of the header.
  - Tapping it opens a **slide-in drawer** using `Sheet`/`Dialog` pattern from shadcn.
- Drawer background: white; full height; same nav items as desktop sidebar.

Example (soft) pattern:

```tsx
// Logo text hidden on small, shown on sm+
<svg className="h-7 w-auto hidden sm:block" /* wordmark */ />
<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand.primarySoft sm:mr-1">
  {/* gem icon always visible */}
</div>
```

---

## 4. Header / Logo Behavior (HARD: responsive logo rule)

- The **gem icon** is always visible.
- The **“Omni STOCK” wordmark text should be hidden on narrow viewports**.

Implementation pattern (HARD in spirit, soft in exact classes):

```tsx
<div className="flex items-center gap-2">
  {/* Gem icon – always visible */}
  <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand.primarySoft">
    {/* gem SVG */}
  </div>

  {/* Wordmark – visible only at sm+ */}
  <svg
    viewBox="0 0 260 64"
    className="hidden h-7 w-auto sm:block"
    aria-label="OmniStock"
  >
    {/* Omni STOCK text paths */}
  </svg>
</div>
```

- On **very small screens**, only the gem shows.
- On **sm and up**, gem + wordmark.

---

## 5. Key Components (shadcn + Tailwind)

These are **patterns to copy**, not strict requirements.

### 5.1 Top Navbar

- Left:
  - Gem icon
  - Wordmark (hidden on mobile)
- Right:
  - `Import CSV` (outline)
  - `Add item` (primary Tiffany button)
  - User avatar or vendor selector.

Buttons:

```tsx
// Outline
<Button
  variant="outline"
  className="border-brand.border bg-white text-xs font-medium text-slate-700 hover:bg-brand.surfaceAlt"
>
  Import CSV
</Button>

// Primary
<Button className="rounded-full bg-brand.primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand.primaryDark">
  Add item
</Button>
```

### 5.2 Page Hero

- H1: “Your collection, organized.”
- Subtext: brief explanation.
- Under that, small metric cards row:
  - Total items
  - From vendors
  - Estimated value
  - Items this month

Use shadcn `Card` with `bg-brand.surface` & `border-brand.border`.

### 5.3 Search + Tabs

- Search input: full-width, `rounded-xl`, subtle border.
- Tabs: `Tabs` from shadcn, styled as underlined.

Active tab style pattern:

```tsx
<TabsTrigger
  value="all"
  className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm text-slate-500 data-[state=active]:border-brand.primary data-[state=active]:text-slate-900"
>
  All items
</TabsTrigger>
```

### 5.4 Item Cards

- Use `Card`.
- Background: `bg-brand.surface`.
- Border: `border-brand.border`.
- Hover: slightly darker `bg-brand.surfaceAlt` / border `border-brand.primary`.

Include:

- Item name
- Category badge (Card/Video game/Fashion/Beauty/Figure)
- Status pill (New, Very good, Mint in box, etc.)
- Vendor name
- Last updated + value (optional)

Status pill pattern:

```tsx
<span className="inline-flex items-center rounded-full bg-state.goodBg px-2 py-0.5 text-[11px] font-medium text-state.goodText">
  Mint in box
</span>
```

### 5.5 Right Rail Panels

- Panels like “Recently added”, “Top vendors this month”.
- Use `Card` with `rounded-2xl`, `bg-brand.surface`, `border-brand.border`.
- Items inside use `text-sm text-slate-800` + `text-[11px] text-slate-500` meta.

---

## 6. Vendor-Focused Views

- “Vendors” page or “Items from [Vendor]” uses:
  - Hero with stats for that vendor.
  - Table layout for items:
    - Columns: Item, Category, Status, Vendor, Value.
  - Same color rules as above.

---

## 7. Iconography

- Use **Font Awesome** icons.
- Neutral colors:
  - `text-slate-400` default.
  - `text-brand.primary` for active/highlight if needed.

---

## 8. Interaction Rules (soft)

- Use `transition-colors duration-150` on interactive elements.
- Focus states should be visible:
  - `outline outline-2 outline-brand.primary outline-offset-2`.
- Hover should be subtle, not dramatic.

---

## 9. Summary for Agents

1. **MUST**: White background + Tiffany blue primary + neutral teal/gray scheme.
2. **MUST**: UI must work on **mobile and desktop**.
3. **MUST**: On small screens, show only the gem icon; hide the “Omni STOCK” text.
4. **MUST**: Sidebar becomes a slide-in drawer on mobile, not a fixed column.
5. **SHOULD**: Use shadcn components (`Card`, `Button`, `Tabs`, `Sheet`, etc.) with Tailwind for styling.
6. **SHOULD**: Use the provided patterns (cards, tabs, stats row, right rail) as a style reference, not rigid templates.
7. If in doubt, prioritize:
   - Clean, airy, fashion-adjacent look  
   - Neutral enough for all collectors  
   - Consistent white + Tiffany UI.
