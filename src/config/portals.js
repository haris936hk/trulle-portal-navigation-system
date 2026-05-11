/**
 * Portal configuration — static geometry + configurable destinations.
 *
 * Ring path data and overlay positions are derived from the SVG artwork
 * (viewBox 3840 × 2160). These never change unless the artwork changes.
 *
 * Destinations use explicit fields:
 * - destination: where the portal opens
 * - preview: what appears inside the peephole on hover
 *
 * In WordPress, override them via the data-portals attribute on the
 * mount element, or configure per-portal in the Elementor HTML widget.
 */

const PORTALS = [
  {
    id: 1,
    label: 'Portal 1',
    left: 39.31,
    top: 48.97,
    width: 3.43,
    height: 6.31,
    cx: 1511.96,
    cy: 1058.32,
    outerR: 95,
    innerR: 75,
    outerOpacity: 0.99964,
    destination: '',
    preview: '',
  },
  {
    id: 2,
    label: 'Portal 2',
    left: 28.06,
    top: 26.95,
    width: 3.10,
    height: 5.97,
    cx: 1078.31,
    cy: 584.52,
    outerR: 95,
    innerR: 75,
    outerOpacity: 1,
    destination: '',
    preview: '',
  },
  {
    id: 3,
    label: 'Portal 3',
    left: 12.40,
    top: 68.55,
    width: 3.48,
    height: 6.49,
    cx: 479.0,
    cy: 1481.76,
    outerR: 95,
    innerR: 75,
    outerOpacity: 1,
    destination: '',
    preview: '',
  },
  {
    id: 4,
    label: 'Portal 4',
    left: 60.11,
    top: 91.61,
    width: 3.59,
    height: 7.22,
    cx: 2308.28,
    cy: 1979.48,
    outerR: 95,
    innerR: 75,
    outerOpacity: 1,
    destination: '',
    preview: '',
  },
  {
    id: 5,
    label: 'Portal 5',
    left: 73.79,
    top: 29.50,
    width: 3.26,
    height: 6.44,
    cx: 2831.99,
    cy: 635.58,
    outerR: 95,
    innerR: 75,
    outerOpacity: 1,
    destination: '',
    preview: '',
  },
];

export default PORTALS;
