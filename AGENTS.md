# Trulle Portal — Project Context

## The Vision: "The Peephole Mask"
The portal system is not a traditional navigation menu; it is a **cinematic mask**. 
- **The Mask:** A solid white canvas with black lines and black rings that sits *on top* of the real content (images, videos, or websites).
- **The Peephole:** Hovering over a portal circle creates a literal "peephole" in the white mask, revealing the hidden content sitting behind it.
- **The Reveal:** Clicking a portal expands this hole seamlessly until the entire mask is gone, revealing the full-screen view.
- **The Feel:** No page refreshes, no forward navigation flicker. It is a 100% continuous visual unmasking of the background.

## Tech Stack
- **Core:** React, HTML5, CSS3.
- **Rendering:** PixiJS 8 (WebGL) for high-performance masking and cinematic transitions.
- **Artwork:** High-fidelity SVG (4K ViewBox: 3840 × 2160) for static background lines.
- **Animation:** GSAP 3.13+ (Core) driving WebGL properties.

## System Architecture: The Hybrid Triple-Layer Model
Interactions and rendering are split between three perfectly synchronized layers:

### 1. Static Visual Layer (SVG)
- **Role:** Renders the intricate background paths (the black lines on a white canvas).
- **Constraint:** Non-interactive. Stripped of all dynamic rings to maximize crispness and reduce CPU load.

### 2. Dynamic Rendering Layer (PixiJS / WebGL)
- **Role:** Handles the portal rings, the media textures, and the high-performance masking.
- **Position:** Sits precisely between the SVG Artwork and the HTML Hit-boxes.
- **Mechanism:** Uses `PIXI.Graphics` as a mask for `PIXI.Sprite` media. This eliminates the sub-pixel "bleeding" artifacts common in DOM-based masking.

### 3. Interactive Hit-box Layer (HTML)
- **Role:** Invisible `.portal-overlay` divs that catch mouse events (`hover`, `click`).
- **Logic:** Communicates with the PixiJS layer via a Zustand store (`portalStore.js`).

## Transition & State
- **Forward:** Click → `openPortal()` → GSAP expands PixiJS mask/rings to ~5000px → Hide Portal System → Reveal Destination.
- **Reverse:** Browser Back → `useBackNavigation()` detects entry → Instantly set PixiJS to expanded state → GSAP shrinks everything back to base scale (1.0).

## Coding Standards & Rules

### Ring Stroke Behavior (Current Runtime)
- **Rule:** The current production runtime uses scale-based animation on Pixi ring/mask objects.
- **Implementation:** GSAP animates `.scale` for ring, mask, and media depth motion. This is intentional in the current code path.
- **Note:** If non-scaling `6.5px` stroke fidelity is required later, it should be implemented as a separate refactor (radius redraw strategy).

### Data-Driven Configuration
- **Rule:** Never hardcode media paths in components. All configuration must be read from `src/config/portals.js` (which is populated via WordPress data attributes).

### Animations
- **Easings:** Prefer `power2.out` for hover entries and `expo.in` for the cinematic "going inside" expansion.

## Architecture Policy
- **Maintained runtime:** React + PixiJS IIFE bundle (`dist/portal-nav.iife.js`) mounted on `#trulle-portal-root` with `data-portals`.
- **Legacy runtime:** `portal-nav.js` + `elementor-widget.html` + `index-standalone.html` are deprecated compatibility artifacts and are not the source of truth.

## Key Files & Roles
- `src/components/PixiPortalLayer.jsx`: The WebGL masking engine.
- `src/components/SVGArtwork.jsx`: Static background line-art.
- `src/components/Portal.jsx`: Invisible interaction hit-boxes.
- `src/store/portalStore.js`: State bridge between HTML interaction and WebGL rendering.
- `src/hooks/usePortalTransition.js`: Cinematic expansion/back-navigation engine.
- `src/hooks/usePortalHover.js`: Peephole reveal animations.

## Operational Commands
- **Environment:** Vite / React.
- **Verification:** Check `gsap.version` and `PIXI.VERSION` in the console.
