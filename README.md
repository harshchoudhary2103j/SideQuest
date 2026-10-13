# SideQuest — High-Fidelity Product UI (Phase 2)

> **Tagline:** Same friends. New adventures.  
> **Product Principle:** Friends are the heroes; Questy is their shared companion.  
> **Personality:** Premium layout with chaotic gaming energy.

SideQuest is a private, friend-group-first real-life challenge game. Friends form private squads, share an evolving AI mascot called **Questy**, complete daily spontaneous real-world missions, submit proof, earn squad XP, unlock Questy evolutions, and archive their private memories in the Squad Lore Vault.

This repository contains the complete **Phase 2: High-Fidelity Product UI** featuring a rich responsive design, interactive client-side state, centralized mock data, and multi-format proof submissions.

---

## 1. Technology Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Bundler & Tooling**: Vite 8 + Oxlint
- **Routing**: React Router (v7) Data Mode
- **State Management**: Reactive React Context (`SquadContext`) with centralized mock store
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

### Type Checking & Build
```bash
npm run build   # Runs `tsc -b && vite build` (Strict TypeScript verification + production bundle)
```

### Code Quality & Linting
```bash
npm run lint    # Runs Oxlint across all source files (0 warnings, 0 errors)
```

### Production Preview
```bash
npm run preview # Preview the production bundle locally
```

---

## 3. High-Fidelity Screens & Flows (Phase 2)

### A. Welcome & Entry (`/welcome`)
- **Emotional Hook**: Floating animated Questy hero with glowing stardust aura and friendly welcoming speech bubble.
- **Product Overview**: 3 clear value pillars (Private Squads, Daily Real-World Missions, Evolving Shared Mascot).
- **Actions**:
  - Primary CTA: *"Start Your Adventure"* → directs to `/onboarding`.
  - Secondary CTA: *"Sign In with Squad Code"* → opens modal for instant entry with demo squad code (`CHAOS-7729`).

### B. Onboarding Experience (`/onboarding`)
Interactive 4-step wizard with step progression indicators and back navigation:
1. **Adventurer Identity**: Display name, handle, and squad aura selector (Midnight Rebel, Neon Goblin, Solar Paladin, Cosmic Mystic).
2. **Questy Core Principles**: Introduction to Questy as a shared companion that evolves only when the entire squad acts.
3. **Squad Choice**: Toggle between *"Create New Squad"* (squad name, vibe tag) and *"Join with Invite Code"* (pre-filled with demo squad code `CHAOS-7729`).
4. **Squad Portal Activation**: Squad summary card with launch button taking the player directly to Squad Home.

### C. Squad Home (`/app` & `/app/squad`)
- **Squad Header**: Squad name (*"The Chaos Crew"*), 7-day streak badge, level indicator, and live squad roster with status rings.
- **Priority Action Card**: Prominent *"Today's Quest"* hero banner with XP reward, countdown timer, and a direct *"Start Mission"* CTA.
- **Questy Mascot Spotlight**: Expressive animated mascot with real-time reactive speech bubbles (supports petting interaction).
- **Squad XP Progress**: Visual progress bar showing points to next evolution stage (*Glow Buddy*).
- **Squad Presence & Activity Stream**: Real-time event ticker showing teammate actions, submissions, and squad milestones.
- **Demo Invite Code Modal**: Accessible dialog with 1-click clipboard copy for demo squad code (`CHAOS-7729`).

### D. Missions Hub (`/app/missions`)
- **Season 1 Badge**: Thematic season branding (*"Season 1: Spontaneous Summer"*).
- **Questy Mission Briefing**: Helpful mascot tip card explaining guidelines and submission formats.
- **Filter Tabs**: Filter between *All Missions*, *Active Today*, and *Completed*.
- **Mission Cards**: Categorized cards (Food, Creative, Social, Exploration) with difficulty chips, XP rewards, submission constraints, and state badges (*Available*, *Submitted*, *Completed*).

### E. Mission Details & Submission (`/app/missions/:missionId`)
- **Mission Briefing**: Full quest title, lore background, instructions, and rules checklist.
- **Multi-Format Proof Station**:
  - **Photo & Video Upload**: Local file picker with file size validation, image/video type detection, instant object URL preview, and memory cleanup.
  - **Voice Memo Option**: One-tap simulated squad audio log recording with live timer and audio waveform simulator.
  - **Text Story & Caption**: Input field for mission captions and squad jokes.
- **Safe Validation**: Validates that at least one form of proof is provided before enabling submission.
- **Simulated Submission**: Displays loading state with optimistic UI update before routing to the results celebration.

### F. Mission Results Celebration (`/app/missions/:missionId/result`)
- **Celebration Feedback**: Confetti celebration, glowing victory badge, and +100 Squad XP reward ticker.
- **Questy Evaluation**: Playful simulated mascot commentary validating the squad's chaos.
- **Teammate Reactions**: Realistic simulated squad reactions with emojis and comments from squad mates.
- **Next Steps**: Direct CTAs to view the new memory in the *Squad Lore Vault* or return to *Squad Home*.

### G. Squad Lore Vault (`/app/lore`)
- **Private Squad Scrapbook**: Nostalgic polaroid-style memory cards preserving completed squad quests, milestones, and funny moments.
- **Category Filters**: Filter memories by *All*, *Missions*, *Milestones*, and *Squad Chaos*.
- **Interactive Reactions**: Tap-to-heart counter on each polaroid memory.
- **Squad Sticker Pack**: Collectible sticker collection earned through squad progression with interactive click reactions.
- **Empty State**: Custom Questy empty state with CTA to complete missions if no memories match a filter.

### H. Profile & Mascot Evolution Vault (`/app/profile`)
- **Player Dossier**: Avatar, display name, handle, squad title, and aura badge.
- **Personal & Squad Stats**: Lifetime missions, streak count, personal contribution XP, and squad rank.
- **Interactive Evolution Vault (All 5 Stages)**:
  1. *Star Pup* (Lvl 1 — Current Active)
  2. *Glow Buddy* (Lvl 2 — 500 XP)
  3. *Quest Pal* (Lvl 3 — 1,500 XP)
  4. *Star Guardian* (Lvl 4 — 3,500 XP)
  5. *Legendary Questy* (Lvl 5 — 7,000 XP)
- **Interactive Stage Viewer**: Selecting any stage updates Questy's preview, personality description, and unlocked perks while clearly distinguishing unlocked vs. locked stages.
- **Squad Roster & Invite Controls**: View all squad members and copy the demo invite code.

### I. Design System Showcase (`/app/design-system`)
Interactive showcase documenting all tokens and components:
- Color swatches with click-to-copy hex codes.
- Typography scale and text styles.
- Buttons (all variants, sizes, loading states).
- Input controls and error/helper states.
- Modal dialog preview with keyboard accessibility.
- Badges, Avatars, Progress Bars, Skeletons, and Toasts.
- Questy expressions (8 variations), poses, and evolution stages.

---

## 4. Centralized Mock Data Layer & State Store

All data structures are typed and centralized to cleanly decouple the UI from future backend implementations:

```
src/
├── types/
│   ├── index.ts           # Unified type export
│   ├── mascot.ts          # Mascot expressions, evolution stages, poses
│   ├── mission.ts         # Mission categories, difficulties, submissions
│   └── squad.ts           # Squad, member, activity event, lore item types
├── lib/
│   └── mockData.ts        # INITIAL_SQUAD, INITIAL_MISSIONS, INITIAL_ACTIVITY, INITIAL_LORE
└── context/
    ├── SquadContext.tsx   # Reactive state provider
    ├── squadContextDef.ts # Context definition & interface
    ├── useSquad.ts        # Custom hook
    └── index.ts           # Export barrel
```

### Reactive Session Actions
- `submitMissionProof(missionId, submission)`: Updates mission state to completed, increments squad XP, records the submission in the Squad Lore Vault, triggers activity event, and checks for evolution unlocks.
- `petQuesty()`: Triggers happy reaction and speech bubble.
- `createOrJoinSquad(name, code, aura)`: Dynamically updates the active squad in local session state.

---

## 5. Visual Design System & Tokens

### Color Palette Tokens (`src/styles/tokens.css`)

| Token | Hex Value | Role & Usage |
|---|---|---|
| `--color-bg-main` | `#080B18` | Deep midnight canvas |
| `--color-surface-standard` | `#11162A` | Standard card and container surface |
| `--color-surface-raised` | `#191F38` | Elevated modals, tooltips, raised cards |
| `--color-border-subtle` | `#292F49` | Low-contrast borders & dividers |
| `--color-text-primary` | `#F5F6FF` | High-contrast display & body text |
| `--color-text-secondary` | `#A4ABC4` | Subtitles, descriptions, timestamps |
| `--color-primary-action` | `#D4FF38` | Neon lime CTA buttons, active states |
| `--color-text-action` | `#080B18` | Dark text on lime action elements |
| `--color-purple` | `#7C3AED` | Electric purple brand identity and glow |
| `--color-pink` | `#F04F9D` | Playful pink reactions & badge accents |
| `--color-gold` | `#FFC857` | Reward gold, crowns, badges, and XP counters |
| `--color-success` | `#45D6A0` | Success banners, online status indicators |
| `--color-error` | `#FF647C` | Destructive actions, validation errors |

### Responsive Breakpoints
- **Mobile (< 768px)**: Compact header, accessible fixed bottom navigation (`BottomNav`), vertically stacked cards, min 48px touch targets.
- **Tablet (768px – 1024px)**: Adaptive content widths, optimized two-column grids.
- **Desktop (≥ 1024px)**: Fixed left sidebar (`DesktopSidebar`) with real-time squad status, comfortable 880px max-width content container, spacious layouts.

---

## 6. Shared UI Components

All components are located in `src/components/ui/` and exported via `src/components/ui/index.ts`:

1. **`Button`**: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), `isLoading` state with spinner, `fullWidth`, `leftIcon`, `rightIcon`.
2. **`Input`**: Accessible text/search/file input with label, error text, helper text, and icon adornments.
3. **`Modal`**: Accessible dialog overlay (`role="dialog"`), backdrop blur, Escape key dismissal, body scroll locking, and accessible focus management.
4. **`Card`**: Variants (`standard`, `raised`, `interactive`, `featured`), sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
5. **`Badge`**: Variants (`lime`, `purple`, `pink`, `gold`, `success`, `error`, `neutral`), `dot` indicator, icon support.
6. **`Avatar`**: Sizes (`sm`, `md`, `lg`, `xl`), status indicators (`online`, `busy`, `offline`), rings (`lime`, `purple`, `gold`), with automatic initials fallback.
7. **`ProgressBar`**: Smooth ARIA-compliant progress bar, variants (`lime`, `purple`, `gold`, `gradient`), animated shimmer highlight.
8. **`LoadingIndicator`**: Accessible spinner, dots, and pulse variants.
9. **`Skeleton`**: Shimmer loaders avoiding layout shift during loading.
10. **`EmptyState`**: Centered feedback with Questy illustration, headline, description, and action button.
11. **`ErrorState`**: Error banner with alert ARIA semantics, sad Questy mascot, message, and retry button.
12. **`Toast`**: Global feedback toast system (`ToastProvider` / `useToast`) supporting `success`, `error`, `info`, and `warning` notifications.
13. **`PageHeading`**: Semantic page headers (`<h1>`/`<h2>`) with badge slots, subtitle, and action buttons.
14. **`BottomNav`**: Mobile bottom navigation bar with active indicators and safe-area padding.
15. **`DesktopSidebar`**: Desktop sidebar with squad progress, navigation links, and demo invite code triggers.
16. **`AppShell`**: Responsive layout container balancing mobile intimacy with desktop workspace.

---

## 7. Questy Mascot Architecture

Questy is SideQuest’s shared squad mascot with fluffy white-lavender fur, expressive violet eyes, pink cheeks, tiny purple horns, a golden crown, and a bright star charm.

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

- **Graceful Fallback**: Detailed vector illustration `<MascotVectorFallback />` renders when `.webp` renders are missing, preserving 100% of character traits without layout shift.
- **Accessibility**: Adheres to `prefers-reduced-motion` via Framer Motion.

---

## 8. Application Routes

| Path | Screen Name | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/welcome` |
| `/welcome` | Welcome Landing | Hero landing, value pillars, entry CTAs |
| `/onboarding` | Squad Onboarding | 4-step wizard to setup profile and create/join squad |
| `/app` | Squad Home Redirect | Redirects to `/app/squad` |
| `/app/squad` | Squad Home | Today's quest, Questy spotlight, XP bar, activity feed |
| `/app/missions` | Missions Hub | Season briefing, quest list, filter chips, difficulty badges |
| `/app/missions/:missionId` | Mission Details & Submit | Quest rules checklist, file/voice/text proof submission station |
| `/app/missions/:missionId/result` | Mission Celebration | Victory celebration, +100 XP ticker, Questy AI commentary |
| `/app/lore` | Squad Lore Vault | Polaroid memory scrapbook, category filters, sticker pack |
| `/app/profile` | Profile & Evolution Vault | Adventurer stats, mascot evolution vault (stages 1–5) |
| `/app/design-system` | Design System Showcase | Visual testbed for tokens, components, inputs, and mascot |
| `*` | 404 Not Found | Friendly 404 screen with surprised Questy and home CTA |

---

## 9. Known Limitations (Phase 2 Scope Boundaries)

- **Client-Side Session State**: Mock state updates reactively within the browser session (XP gains, completed missions, lore additions), but is not persisted across hard page reloads or synced across devices.
- **Simulated Proof Storage**: File uploads generate local browser Object URLs (`URL.createObjectURL`) for preview; no media is sent to external servers or cloud storage.
- **Simulated AI Feedback**: Questy's mission evaluations and squad chat reactions use realistic simulated scripts rather than live LLM API calls.
- **Demo Invitation Code**: The squad invite code (`CHAOS-7729`) is an interactive demo simulation with 1-click clipboard copy, clearly badged as a demo.

---

## 10. Recommended Roadmap for Phase 3

1. **Supabase Integration**:
   - Implement Supabase Auth (magic link / social login).
   - Set up PostgreSQL schema for squads, squad memberships, missions, submissions, and lore entries.
   - Configure Supabase Storage buckets for mission photos and audio proofs with image optimization.
2. **Real-Time Squad Sync**:
   - Supabase Realtime / WebSockets for live squad activity ticker, instant teammate reaction feeds, and shared XP updates.
3. **AI Evaluation Pipeline**:
   - Connect proof uploads to Gemini multimodal API to generate funny, contextual Questy commentary and automatic verification flags.
4. **Native PWA Enhancements**:
   - Add Web App Manifest and Service Worker caching for offline memory viewing and home screen installability.
   - Web Share API integration for inviting friends directly via messaging apps.
