# أزهري — Discord-style Professional Redesign

A full visual + UX overhaul that brings the app to Discord-grade polish while keeping the Islamic green identity, full RTL Arabic, and Cairo/Amiri typography. Every page is redesigned, the layout works on phone/tablet/desktop, and known runtime bugs are swept.

---

## 1. Design system overhaul (`src/index.css` + `tailwind.config.ts`)

Rebuild the token layer so every page inherits the same Discord-grade surface system.

**Dark theme (default)** — layered near-black surfaces, Islamic emerald accent:
- `--background` deep charcoal `#0f1310`
- `--sidebar-background` darker `#0a0d0b` (Discord's server rail feel)
- `--card` / channel surface `#161b18`
- `--popover` / hover `#1d2420`
- `--primary` emerald `#1f9d6b` (kept on-brand)
- `--accent` warm gold `#d4a84c` for mentions/badges
- `--ring` emerald glow
- Subtle geometric Islamic pattern as a 4% opacity SVG background on auth/splash only

**Light theme** — refined parchment, not the current flat gray:
- `--background` `#f7f5f0` (warm paper)
- `--sidebar-background` `#ebe7dd`
- `--card` `#ffffff`
- Same emerald primary, same gold accent

**Theme toggle**:
- Add `ThemeProvider` (class-based on `<html>`), persisted in `localStorage`
- Toggle button in the top header (sun/moon icon)
- Default = dark

**Typography & motion**:
- Keep Cairo (UI) + Amiri (display headings only)
- Add consistent radii (`--radius: 0.5rem`), elevation shadows, and `transition-colors`/`transition-transform` defaults
- Subtle hover lift on interactive rows (Discord-style `bg-popover` on hover)

---

## 2. App shell — Discord 3-pane responsive layout

Restructure `ChannelLayout.tsx` + `AppSidebar.tsx` into Discord's signature shape:

```text
Desktop (≥1024px)
┌──────┬────────────┬───────────────────────────┐
│ rail │  channels  │   main (messages)         │
│ 72px │   240px    │   flex-1                  │
└──────┴────────────┴───────────────────────────┘

Tablet (768–1023px)
┌──────┬───────────────────────────────────────┐
│ rail │  collapsible channels + main          │
└──────┴───────────────────────────────────────┘

Mobile (<768px)
┌───────────────────────────────────────────────┐
│ top header + hamburger → drawer (rail+chans) │
│ main fills screen                             │
└───────────────────────────────────────────────┘
```

- **Server rail** (right side in RTL): circular icons for College / DMs / Notifications / Admin (admin only) / Invitations, with active pill indicator and tooltips
- **Channel column**: department name header, channel list grouped by category (نصية / صوتية / رسمية), user card footer with avatar + name + settings
- **Main column**: channel header (name + topic + member count), messages, composer pinned to bottom
- Mobile uses shadcn `Sheet`/`Drawer` for the rail + channel column; the hamburger in the header opens it
- Fix the current `SidebarTrigger` so it's visible on every breakpoint (today it's `lg:hidden` only)
- Add a single `<main>` per route (a11y) and proper landmark roles

---

## 3. Page-by-page redesign

Each page gets a Helmet block (SEO already wired) + the new shell + redesigned content.

- **Splash** — centered emerald logo mark with subtle Islamic geometric pulse animation
- **Auth** — split layout on desktop (brand panel + form card), single column on mobile; emerald gradient brand side with Quran-inspired calligraphy motif
- **Onboarding** — multi-step card with progress dots, college/department pickers as searchable command palettes
- **Home** — welcome hero + "your departments" grid + recent activity feed (Discord's "friends" landing equivalent)
- **Channel** — Discord-style message stream: grouped consecutive messages from the same author (avatar only on first), hover reveals reply/forward/copy/react, sticky date dividers, typing indicator slot, empty state illustration
- **DirectMessages** — left list of conversations with last-message preview + unread badge; right empty-state on desktop, full-screen list on mobile
- **DirectMessageChat** — same message styling as Channel, with the other user's header (avatar, name, online dot placeholder)
- **Notifications** — grouped by type (mentions / replies / system) with read/unread states
- **Invitations** — card list with accept/decline inline
- **Admin** — full dashboard redesign with sidebar tabs (Users / Roles / Channels / Colleges / Moderation / Notifications / Stats), responsive table → card switch on mobile

---

## 4. Message UX polish (`MessageList.tsx`, `MessageInput.tsx`, `ForwardMessageDialog.tsx`)

- Group consecutive messages by same author within 5 minutes (Discord behavior)
- Show timestamp on hover for grouped messages, full date divider when day changes
- Reply preview shows a connector line up to the replied message
- Mentions: `@username` becomes a pill with hover card showing profile
- File attachments: image lightbox on click, file cards with type icon + size + download button
- Hover action bar: Reply · Forward · Copy · (future React)
- Composer: auto-growing textarea, attachment button, file preview chips before send, Shift+Enter newline / Enter send, character counter for long messages
- Empty state with friendly Arabic illustration text
- Loading skeletons instead of blank screens
- Scroll-to-bottom floating button when scrolled up

---

## 5. Bug sweep

Issues to fix while redesigning:
- `ChannelLayout` redirect loop edge cases (loading flicker → proper skeleton, guard against `profile` race)
- `SidebarTrigger` hidden on desktop — make always visible in header
- Single `<main>` per route (currently nested in some pages)
- Any remaining `.single()` that should be `.maybeSingle()` in queries
- Realtime subscription cleanup on unmount in Channel + DM pages (prevent ghost listeners)
- Date formatting fallback when `created_at` is null
- Avatar fallback when `full_name` is empty (currently crashes on `[0]`)
- Admin dashboard mobile overflow (tables breaking layout)
- Focus rings and keyboard navigation on all interactive elements
- Color-contrast pass on muted text in both themes

---

## 6. Technical notes

- Theme: new `src/components/ThemeProvider.tsx` + `useTheme` hook, class strategy already enabled in Tailwind
- New `src/components/chat/` folder: `MessageGroup.tsx`, `MessageActions.tsx`, `DateDivider.tsx`, `FileAttachment.tsx`, `EmptyState.tsx`
- New `src/components/layout/` folder: `ServerRail.tsx`, `ChannelColumn.tsx`, `UserCard.tsx`, `MobileNavDrawer.tsx`
- Keep all business logic, Supabase queries, RLS, roles, and routes unchanged — this pass is presentation + responsive + bug fixes only
- No new dependencies required; uses existing shadcn primitives (Sheet, Drawer, Tooltip, HoverCard, Command, Skeleton)

---

## Out of scope (for this pass)
- Reactions, voice channels, presence/online dots backend, read receipts, search — can follow once the shell lands
- Schema or RLS changes
- Role/permission logic changes
