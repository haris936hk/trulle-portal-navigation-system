/**
 * Shared motion configuration for portal timelines.
 * Keep this identical across hooks so timeline instances are reused.
 */
const BASE_PORTAL_MOTION_CONFIG = {
  hoverScale: 8.6,

  // Timeline segment durations
  hoverDuration: 2,
  clickDuration: 2.4,

  // Transition durations (timeline playhead motion)
  hoverOutDuration: 2,
  openDuration: 2,
  backDuration: 2,

  // Transition eases
  hoverEase: "sine.out",
  hoverOutEase: "sine.out",
  openEase: "sine.in",
  backEase: "sine.out",

  // Segment eases
  hoverSegmentEase: "sine.out",
  openSegmentEase: "sine.out",

  // Media reveal timing inside hover segment
  mediaFadeDuration: 0.72,
  mediaFadeDelay: 0.12,
  mediaFadeEase: "sine.out",
};

const PER_PORTAL_HOVER_SCALE = {
  1: 12,
};

const REDUCED_MOTION_CONFIG = {
  hoverScale: 1.7,

  hoverDuration: 0.2,
  clickDuration: 0.34,

  hoverOutDuration: 0.16,
  openDuration: 0.28,
  backDuration: 0.24,

  hoverEase: "power1.out",
  hoverOutEase: "power1.out",
  openEase: "power1.in",
  backEase: "power1.out",

  hoverSegmentEase: "power1.out",
  openSegmentEase: "power1.in",

  mediaFadeDuration: 0.16,
  mediaFadeDelay: 0,
  mediaFadeEase: "none",
};

export const PORTAL_MOTION_CONFIG = BASE_PORTAL_MOTION_CONFIG;

function applyPortalOverrides(config, portalId) {
  const perPortalHoverScale = PER_PORTAL_HOVER_SCALE[portalId];
  if (!perPortalHoverScale) return config;
  return {
    ...config,
    hoverScale: perPortalHoverScale,
  };
}

export function getPortalMotionConfig(portalId) {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return applyPortalOverrides(REDUCED_MOTION_CONFIG, portalId);
  }
  return applyPortalOverrides(BASE_PORTAL_MOTION_CONFIG, portalId);
}
