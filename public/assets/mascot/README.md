# Questy Mascot Asset Directory

This directory hosts production artwork for Questy, SideQuest's shared squad companion.

## Directory Structure

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

## Asset Requirements

- **Format**: Lossless or near-lossless `.webp` with transparent background (alpha channel).
- **Resolution**: 512×512px (minimum 256×256px), square aspect ratio.
- **Style**: Cute, rounded, 3D-inspired fantasy stardust creature with large violet eyes, soft white-lavender body, golden crown, horns, and star chest charm matching `docs/design/questy-character-sheet-reference.jpg`.

## Placeholder & Graceful Fallback System

The `MascotDisplay` component uses `src/components/mascot/mascotRegistry.ts` to locate these assets.
When individual `.webp` files have not yet been placed here:
1. `MascotDisplay` automatically catches the missing asset gracefully.
2. It renders `<MascotVectorFallback />` without layout shifts or broken image icons.
3. Once production `.webp` files are placed into their respective folders, `MascotDisplay` automatically serves the production raster assets without code changes.
