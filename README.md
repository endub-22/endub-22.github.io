# Nebula Art

This repository hosts the **Nebula Art** experiment. The web app is
composed of several small scripts coordinated by `main.js`.

## Module Overview

| File | Purpose |
| --- | --- |
| `nebula-art/main.js` | Loads the p5 sketch and toggles between **Whispers** and **Story** modes. Modules are imported on demand. |
| `nebula-art/sketch.js` | Renders the animated nebula background and exposes helpers for attaching overlays. Parameter controls are managed here via dat.GUI. |
| `nebula-art/whispers.js` | Defines the text overlay shown in Whispers mode. Exports `createWhispers` and `TEXT_DEFAULTS`. |
| `nebula-art/story.js` | Implements the "Whispers from the Nebula" choose‑your‑own‑adventure and exposes a global `NebulaStory` helper. |

## Key Parameters

`sketch.js` maintains a `params` object that controls the appearance of
the nebula:

- `noiseScale`, `tSpeed`, `octaves`, `falloff`, `downsample`
- `palette` – name of the active colour palette
- `vignette` settings – `strength`, `radius`, `softness`, `x`, and `y`

`whispers.js` exposes `TEXT_DEFAULTS` describing the text overlay:

- `textEnabled`, `textSize`, `textColor`, `textShadow`
- `textFadeInMs`, `textHoldMs`, `textFadeOutMs`
- `textFont`, `textStyle`, `textPosition`, `textBoxWidth`

The selected mode is persisted in `localStorage` as `nebula_mode`.

