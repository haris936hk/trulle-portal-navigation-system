=== Trulle Portal Elementor ===
Contributors: trulle
Tags: elementor, portal, media, navigation
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

GUI-based Elementor widget for configuring Trulle Portal destinations and previews without editing JSON.

== Description ==

Trulle Portal Elementor provides a widget called **Trulle Portal Config**.

Editors can configure:
- Portal ID (1-5)
- Label
- Destination URL (required)
- Preview media (image/video) or preview URL override
- Enabled/disabled state

The widget outputs normalized `data-portals` JSON for the Trulle frontend runtime.

== Installation ==

1. Upload `trulle-portal-elementor` to `/wp-content/plugins/`.
2. Activate the plugin in WordPress Admin.
3. Ensure Elementor is installed and active.
4. Add **Trulle Portal Config** widget to your page.
5. Fill portal rows and publish.

== Build / Update Assets ==

From the project root:

`npm run build:wp`

This builds frontend assets and copies:
- `dist/portal-nav.iife.js` -> `wordpress/trulle-portal-elementor/assets/portal-nav.iife.js`
- `dist/portal-nav.css` -> `wordpress/trulle-portal-elementor/assets/portal-nav.css`

== Notes ==

- Portal IDs are limited to **1-5** (current runtime geometry slots).
- Rows with invalid configuration are skipped and shown as configuration notes.
- Destination is required for a portal row to render.
- Asset cache-busting uses file modification time in enqueue versioning.

== Changelog ==

= 0.1.0 =
* Initial Elementor widget release.
* Repeater-based portal GUI.
* Frontend enqueue wiring with filemtime cache-busting.
* Validation for destination and preview format.
* Editor-visible configuration warnings for skipped rows.

