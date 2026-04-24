# Portal Navigation — WordPress Setup Guide

---

## Recommended (React IIFE + data-portals JSON)

Use this as the primary integration path for Elementor customization.
Editors only update portal content in one JSON field.

### Build assets

Run:

```bash
npm run build
```

Upload these generated files to your theme (for example `wp-content/themes/YOUR-THEME/portal/`):

- `dist/portal-nav.iife.js`
- `dist/portal-nav.css`

### Enqueue in `functions.php`

```php
<?php
add_action( 'wp_enqueue_scripts', 'trulle_portal_enqueue' );

function trulle_portal_enqueue() {
    wp_enqueue_style(
        'trulle-portal',
        get_stylesheet_directory_uri() . '/portal/portal-nav.css',
        array(),
        '2.0.0'
    );

    wp_enqueue_script(
        'trulle-portal',
        get_stylesheet_directory_uri() . '/portal/portal-nav.iife.js',
        array(),
        '2.0.0',
        true
    );
}
```

### Elementor HTML widget (single mount element)

Paste only this:

```html
<div
  id="trulle-portal-root"
  data-portals='[
    {
      "id": 1,
      "label": "About",
      "href": "https://yoursite.com/about/",
      "thumbnail": "https://yoursite.com/wp-content/uploads/2026/04/about.jpg",
      "video": ""
    },
    {
      "id": 2,
      "label": "Work",
      "href": "https://yoursite.com/work/",
      "thumbnail": "https://yoursite.com/wp-content/uploads/2026/04/work.jpg",
      "video": ""
    }
  ]'
></div>
```

Rules:

- Keep `id` values `1` to `5` (geometry is fixed in code).
- Editors can safely update only `label`, `href`, `thumbnail`, `video`.
- Use either `thumbnail` or `video` (video has priority when both are set).
- Set `href` to empty string to disable a portal.

---

## Legacy (Deprecated) Setup

The sections below describe the old vanilla `portal-nav.js` integration.
They are kept for backward compatibility only and are not the maintained path.

## Files

| File | What it is |
|---|---|
| `elementor-widget.html` | Paste into Elementor HTML widget on home page |
| `portal-nav.css` | Upload to theme or child theme, enqueue via PHP |
| `portal-nav.js` | Upload to theme or child theme, enqueue via PHP |

---

## Step 1 — Upload the files

Upload `portal-nav.css` and `portal-nav.js` to your theme's directory.
Recommended path: `wp-content/themes/YOUR-THEME/portal/`

---

## Step 2 — Enqueue via functions.php

Add this to your **child theme's** `functions.php`
(never edit the parent theme directly):

```php
<?php
// Portal Navigation — enqueue CSS + JS + GSAP CDN
add_action( 'wp_enqueue_scripts', 'portal_nav_enqueue' );

function portal_nav_enqueue() {

    // GSAP core (free, all plugins included since v3.13)
    wp_enqueue_script(
        'gsap',
        'https://cdn.jsdelivr.net/npm/gsap@3.13/dist/gsap.min.js',
        array(),
        '3.13',
        true   // load in footer
    );

    // Portal CSS — adjust path to match your upload location
    wp_enqueue_style(
        'portal-nav',
        get_stylesheet_directory_uri() . '/portal/portal-nav.css',
        array(),
        '1.0'
    );

    // Portal JS — depends on GSAP
    wp_enqueue_script(
        'portal-nav',
        get_stylesheet_directory_uri() . '/portal/portal-nav.js',
        array( 'gsap' ),   // GSAP must load first
        '1.0',
        true               // load in footer
    );
}
```

---

## Step 3 — Add the Elementor HTML widget

1. Edit your **home page** in Elementor
2. Add a new **HTML** widget (search "HTML" in the widget panel)
3. Paste the entire contents of `elementor-widget.html` into the code field
4. **Update / Save**

> The SVG aspect-ratio is 16:9. Set the section / column width to
> 100% of the page, no padding, for the SVG to fill the viewport correctly.

---

## Step 4 — Configure each portal

In the Elementor HTML widget, find the 5 `.portal-overlay` divs.
Edit **only** these three data attributes per portal:

```html
data-href=""        ← Paste the full URL: https://yoursite.com/page-name/
data-thumbnail=""   ← Paste image URL from Media Library (right-click → Copy URL)
data-video=""       ← Paste .mp4 URL (leave blank if using thumbnail image)
```

**Example (Portal 1 configured):**
```html
<div
  class="portal-overlay"
  data-portal-id="1"
  data-href="https://yoursite.com/about/"
  data-thumbnail="https://yoursite.com/wp-content/uploads/about-thumb.jpg"
  data-video=""
  style="left:39.374%; top:49.0%; width:4.738%; height:8.833%;"
  aria-label="About"
>
  <div class="portal-media"></div>
</div>
```

You do **not** need to touch any other code. All 5 portals follow the same pattern.

---

## Step 5 — Destination page fade-in

For the smooth white-to-page fade-in when arriving via a portal,
add a CSS class to the `<body>` element on each destination page.

### Option A — Via Elementor Page Settings (recommended)
1. Open destination page in Elementor
2. Hamburger menu → **Page Settings** → **Body CSS Classes**
3. Type `portal-destination`
4. Save

### Option B — Via functions.php
```php
// Adds portal-destination to body class on all non-home pages
add_filter( 'body_class', 'portal_destination_body_class' );

function portal_destination_body_class( $classes ) {
    if ( ! is_front_page() ) {
        $classes[] = 'portal-destination';
    }
    return $classes;
}
```

---

## Step 6 — Back navigation (reverse animation)

No additional setup needed. The reverse animation works automatically:

1. Visitor clicks a portal → oval expands → navigates to destination page
2. Visitor clicks browser back → returns to home page
3. JS detects the `sessionStorage` entry and plays the reverse animation
   (oval shrinks from full-screen back to its resting size)

The detection window is 45 seconds. If the user spends more than 45 seconds
on the destination page before going back, the reverse animation is skipped
and the home page loads normally.

---

## Thumbnail recommendations

| Use | Format | Size |
|---|---|---|
| Static image | JPG / WebP | 800 × 800px minimum |
| Video loop | MP4 (H.264) | 10–20s, no audio track, < 5MB |

Images and videos are automatically desaturated to match the B&W aesthetic.
To remove the grayscale effect, delete `filter: grayscale(100%)` from
`.portal-media img, .portal-media video` in `portal-nav.css`.

---

## Troubleshooting

**Portals are invisible on hover**
→ Check GSAP loaded — open browser console, type `gsap.version`, should return `"3.13.x"`

**Portal position is off from the SVG oval**
→ The container section in Elementor must be 100% width with zero padding/margin.
   Add `overflow: visible` to the Elementor section if portals are clipped.

**Back animation doesn't play**
→ Browser back must occur within 45 seconds (configurable: `BACK_NAV_WINDOW` in portal-nav.js).
   Private/incognito browsers block sessionStorage — back animation won't fire there.

**Page navigates before animation completes**
→ Increase `CLICK_DURATION` in portal-nav.js (default: 1.1 seconds).

**Video doesn't autoplay**
→ All major browsers require video to be muted for autoplay. The video element is
   created with `muted + autoplay + playsinline`. Confirm your .mp4 has no audio track.
