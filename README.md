# SideQuest — Phase 1: Frontend Foundation and Design System

> **Tagline:** Same friends. New adventures.  
> **Product Principle:** Friends are the heroes; Questy is their shared companion.  
> **Personality:** Premium layout with chaotic gaming energy.

SideQuest is a mobile-first social gaming Progressive Web App (PWA) designed for existing friend groups (squads). Friend groups complete daily spontaneous real-life missions, drop proof, receive playful reactions, stack XP, evolve a shared fantasy mascot (Questy), and preserve their private memories in the Squad Lore Vault.

This repository contains the complete **Phase 1: Frontend Foundation and Design System**.

---

## 1. Technology Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Bundler & Tooling**: Vite 8 + Oxlint
- **Routing**: React Router (v7) Data Mode
- **Styling**: Vanilla CSS Modules with shared CSS custom property tokens
- **Animations**: Framer Motion (respecting `prefers-reduced-motion`)
- **Icons**: Lucide React
- **Typography**: 
  - Display: **Plus Jakarta Sans** (weights: 600, 700, 800)
  - Body: **Inter** (weights: 400, 500, 600)

---

## 2. Quickstart Commands

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Starts local Vite development server on http://localhost:5173
```

### Type Checking
```bash
npm run build   # Runs `tsc -b && vite build`
# or directly:
npx tsc --noEmit
```

### Code Quality & Linting
```bash
npm run lint    # Runs Oxlint across all source files
```

### Production Build
```bash
npm run build
npm run preview # Preview the production bundle locally
```

---

## 3. Visual Design System

### Color Palette Tokens (`src/styles/tokens.css`)

| Token | Hex Value | Role & Usage |
|---|---|---|
| `--color-bg-main` | `#080B18` | Deep midnight main canvas |
| `--color-surface-standard` | `#11162A` | Standard card and container surface |
| `--color-surface-raised` | `#191F38` | Elevated modals, tooltips, raised cards |
| `--color-border-subtle` | `#292F49` | Low-contrast card & divider borders |
| `--color-text-primary` | `#F5F6FF` | High-contrast display & body text |
| `--color-text-secondary` | `#A4ABC4` | Subtitles, descriptions, timestamps |
| `--color-primary-action` | `#D4FF38` | Neon lime CTA buttons, active states, progress |
| `--color-text-action` | `#080B18` | High-contrast dark text on action lime |
| `--color-purple` | `#7C3AED` | Electric purple brand emphasis and glow |
| `--color-pink` | `#F04F9D` | Playful pink reactions & badge accents |
| `--color-gold` | `#FFC857` | Reward gold, crowns, badges, and XP counters |
| `--color-success` | `#45D6A0` | Success banners, online status indicators |
| `--color-error` | `#FF647C` | Destructive actions, system alerts |

### Spacing Scale & Shapes
- **Base Grid**: 8px with 4px fine adjustments (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Card Radius**: `18px` (16–20px range).
- **Button Radius**: `14px` (14–16px range).
- **Pill Radius**: `9999px`.
- **Minimum Touch Target**: `48px`.

---

## 4. Shared UI Components

All components are located in `src/components/ui/` and exported via `src/components/ui/index.ts`:

1. **`Button`**: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), `isLoading` state with spinner, `fullWidth`, `leftIcon`, `rightIcon`.
2. **`Card`**: Variants (`standard`, `raised`, `interactive`, `featured`), sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
3. **`Badge`**: Variants (`lime`, `purple`, `pink`, `gold`, `success`, `error`, `neutral`), `dot` indicator, icon support.
4. **`Avatar`**: Sizes (`sm`, `md`, `lg`, `xl`), status indicators (`online`, `busy`, `offline`), rings (`lime`, `purple`, `gold`), with automatic initials fallback.
5. **`ProgressBar`**: Smooth ARIA-compliant progress bar, variants (`lime`, `purple`, `gold`, `gradient`), animated shimmer highlight.
6. **`LoadingIndicator`**: Accessible spinner, dots, and pulse variants with customizable colors and sizes.
7. **`Skeleton`**: Text, circular, rectangular, and card shimmer loaders avoiding layout shift.
8. **`EmptyState`**: Centered empty feedback with Questy illustration, headline, description, and action button.
9. **`ErrorState`**: Error banner with alert ARIA semantics, sad Questy mascot, message, and retry button.
10. **`Toast`**: Global feedback toast system with `ToastProvider` and `useToast()` hook supporting `success`, `error`, `info`, and `warning` notifications.
11. **`PageHeading`**: Semantic page headers (`<h1>`/`<h2>`) with badge slots, subtitle, and action buttons.
12. **`BottomNav`**: Mobile bottom navigation bar with active indicators, touch targets ≥ 48px, and safe-area padding.
13. **`DesktopSidebar`**: Responsive desktop sidebar with brand identity, quick links, and squad mascot badge.
14. **`AppShell`**: Responsive layout container balancing mobile intimacy with desktop space constraints.

---

## 5. Questy Mascot Architecture

Questy is SideQuest’s shared squad mascot (a stardust creature with soft white-lavender fur, expressive violet eyes, blushing cheeks, stardust horns, golden crown, and chest star charm).

### Component Usage

```tsx
import { MascotDisplay } from '@/components/mascot';

<MascotDisplay
  expression="excited"       // 'happy' | 'excited' | 'mischievous' | 'surprised' | 'sleepy' | 'proud' | 'sad' | 'angry'
  evolutionLevel={1}         // 1 (Star Pup), 2 (Glow Buddy), 3 (Quest Pal), 4 (Star Guardian), 5 (Legendary)
  size="large"               // 'small' (64px) | 'medium' (128px) | 'large' (220px)
  animation="float"          // 'idle' | 'celebrate' | 'float' | 'think' | 'none'
  speechBubble="A new mission awaits! 🚀"
  showStageBadge={true}
  alt="Questy celebrating squad victory"
/>
```

### Mascot Asset Directory Structure

```text
public/assets/mascot/
  base.webp
  expressions/
    happy.webp
    excited.webp
    mischievous.webp
    surprised.webp
    sleepy.webp
    proud.webp
    sad.webp
    angry.webp
  evolution/
    level-1.webp
    level-2.webp
    level-3.webp
    level-4.webp
    level-5.webp
  poses/
    jump.webp
    float.webp
    wave.webp
    celebrate.webp
    sit.webp
    think.webp
```

### Centralized Asset Registry & Graceful Fallback
- `src/components/mascot/mascotRegistry.ts` centralizes asset path resolution. No asset paths are hardcoded in views.
- **Graceful Fallback**: If `.webp` image files are missing or loading, `MascotDisplay` renders `<MascotVectorFallback />`—a detailed vector illustration matching Questy’s exact design sheet traits (custom eye expressions, golden crown, stardust aura, evolution accessories).
- **Zero layout shift**: The component preserves defined dimensions at all times.
- **Accessibility**: Adheres to `prefers-reduced-motion` via `framer-motion` hooks.

### Instructions for Replacing Placeholder Artwork
When production 3D/raster `.webp` assets are exported:
1. Export square `.webp` images (512×512px with transparent alpha channel).
2. Save each file matching the filename in `public/assets/mascot/` (e.g. `expressions/excited.webp`).
3. `MascotDisplay` automatically loads and renders the production asset without requiring changes to any React components.

---

## 6. Application Routes

- `/` → Redirects to `/welcome`
- `/welcome` → Welcome landing page featuring Questy float hero and product principles.
- `/onboarding` → 4-step interactive squad walkthrough and mascot progression preview.
- `/app` → Redirects to `/app/squad`
- `/app/squad` → Squad Home with streak counter, mascot spotlight, pet interaction, XP bar, and active mission preview.
- `/app/missions` → Mission briefing with Questy, active daily quest, photo proof submission, and upcoming locked quest.
- `/app/lore` → Squad Memory Vault with polaroid recaps, reaction counters, and unlocked stickers.
- `/app/profile` → Adventurer profile card, streak stats, and interactive Mascot Evolution Vault (Levels 1–5).
- `/app/design-system` → Comprehensive interactive design system showcase verifying all tokens, expressions, stages, animations, and components.
- `*` → 404 Not Found page featuring surprised Questy.

---

## 7. Project Structure

```text
SideQuest/
├── docs/
│   └── design/
│       └── questy-character-sheet-reference.jpg
├── public/
│   ├── assets/
│   │   └── mascot/
│   │       ├── expressions/
│   │       ├── evolution/
│   │       └── poses/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── DesktopSidebar.tsx
│   │   ├── mascot/
│   │   │   ├── MascotDisplay.tsx
│   │   │   ├── MascotVectorFallback.tsx
│   │   │   └── mascotRegistry.ts
│   │   └── ui/
│   │       ├── Avatar/
│   │       ├── Badge/
│   │       ├── Button/
│   │       ├── Card/
│   │       ├── EmptyState/
│   │       ├── ErrorState/
│   │       ├── LoadingIndicator/
│   │       ├── PageHeading/
│   │       ├── ProgressBar/
│   │       ├── Skeleton/
│   │       └── Toast/
│   ├── pages/
│   │   ├── DesignSystemPage.tsx
│   │   ├── LorePage.tsx
│   │   ├── MissionsPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SquadPage.tsx
│   │   └── WelcomePage.tsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── tokens.css
│   │   └── typography.css
│   └── types/
│       ├── index.ts
│       └── mascot.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 8. Known Limitations (Phase 1 Scope)

- **Authentication & Backend**: Strictly mocked/client-side for Phase 1. No Supabase, database, or API calls.
- **Media Upload**: File upload simulates local confirmation via Toasts without real multipart network transmission.
- **XP & Progression**: XP and level switching are local component states demonstrating the visual system.
- **Production Asset Pack**: Uses high-fidelity vector fallback while waiting for production `.webp` 3D renders.

---

## 9. Next Steps (Recommended for Phase 2)

- Implement high-fidelity screen designs for squad feed, mission proof camera viewfinder, and AI reaction flows.
- Add PWA manifest (`manifest.json`) and service worker configuration for offline caching and home screen installability.
- Prepare Supabase schema integration for squad auth, mission pool, and photo storage.
