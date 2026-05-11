import gsap from 'gsap';

const STAGE_W = 3840;
const STAGE_H = 2160;
const EDGE_SAFE_PAD = 20;
const DEFAULT_RING_STROKE = 6.5;
const DEFAULT_RING_COLOR = 0x1a1a1a;
const DEFAULT_PORTAL_BG = 0xfcfcfc;

function getHoverTarget(pixi, hoverScale) {
  const base = pixi.basePosition || { x: pixi.container.x, y: pixi.container.y };
  const baseGap = pixi.baseRadii.outer - pixi.baseRadii.inner;
  const expandedInnerR = pixi.baseRadii.inner * hoverScale;
  const expandedOuterR = expandedInnerR + baseGap + EDGE_SAFE_PAD;

  return {
    x: gsap.utils.clamp(expandedOuterR, STAGE_W - expandedOuterR, base.x),
    y: gsap.utils.clamp(expandedOuterR, STAGE_H - expandedOuterR, base.y),
  };
}

function drawPortalGeometry(pixi, innerR, outerR) {
  const ringStroke = pixi.ringStrokeWidth ?? DEFAULT_RING_STROKE;
  const ringColor = pixi.ringColor ?? DEFAULT_RING_COLOR;
  const portalBg = pixi.portalBgColor ?? DEFAULT_PORTAL_BG;

  pixi.outerRing.clear();
  pixi.outerRing.circle(0, 0, outerR);
  pixi.outerRing.stroke({ width: ringStroke, color: ringColor, alignment: 0.5 });

  pixi.innerRing.clear();
  pixi.innerRing.circle(0, 0, innerR);
  pixi.innerRing.stroke({ width: ringStroke, color: ringColor, alignment: 0.5 });

  pixi.mask.clear();
  pixi.mask.circle(0, 0, innerR);
  pixi.mask.fill({ color: 0xffffff });

  pixi.gapCover.clear();
  pixi.gapCover.circle(0, 0, Math.max(0, outerR - ringStroke * 0.5));
  pixi.gapCover.fill({ color: portalBg });
}

export function ensurePortalMotion(pixi, overlay, config) {
  const configKey = [
    config.hoverScale,
    config.hoverDuration,
    config.clickDuration,
    config.hoverSegmentEase,
    config.openSegmentEase,
    config.mediaFadeDuration,
    config.mediaFadeDelay,
    config.mediaFadeEase,
  ].join('|');
  const existing = pixi.motion;
  if (existing && existing.overlay === overlay && existing.configKey === configKey) {
    return existing;
  }

  if (existing?.timeline) {
    existing.timeline.kill();
  }
  if (existing?.tween) {
    existing.tween.kill();
  }

  const hoverTarget = getHoverTarget(pixi, config.hoverScale);
  const { container, mediaSprite } = pixi;
  const requiredRadius = Math.max(
    Math.hypot(hoverTarget.x, hoverTarget.y),
    Math.hypot(STAGE_W - hoverTarget.x, hoverTarget.y),
    Math.hypot(hoverTarget.x, STAGE_H - hoverTarget.y),
    Math.hypot(STAGE_W - hoverTarget.x, STAGE_H - hoverTarget.y),
  ) + EDGE_SAFE_PAD;
  const baseInner = pixi.baseRadii.inner;
  const baseOuter = pixi.baseRadii.outer;
  const baseGap = baseOuter - baseInner;
  const hoverInner = baseInner * config.hoverScale;
  const hoverOuter = hoverInner + baseGap;
  const openInner = requiredRadius;
  const openOuter = openInner + baseGap;
  const base = pixi.basePosition || { x: pixi.container.x, y: pixi.container.y };
  const shiftX = hoverTarget.x - base.x;
  const shiftY = hoverTarget.y - base.y;
  const mediaRest = pixi.mediaRest || { x: 0, y: 0, scale: 1 };
  const hoverMediaX = mediaRest.x - shiftX;
  const hoverMediaY = mediaRest.y - shiftY;
  const openMediaX = mediaRest.x - shiftX;
  const openMediaY = mediaRest.y - shiftY;

  const geometryState = {
    innerR: baseInner,
    outerR: baseOuter,
  };
  const updateGeometry = () => {
    drawPortalGeometry(pixi, geometryState.innerR, geometryState.outerR);
  };

  const tl = gsap.timeline({
    paused: true,
    defaults: { overwrite: 'auto' },
  });

  tl.addLabel('rest', 0);
  tl.set(container.scale, { x: 1, y: 1 }, 0);
  tl.set(container, { x: base.x, y: base.y }, 0);
  tl.set(geometryState, {
    innerR: baseInner,
    outerR: baseOuter,
    onUpdate: updateGeometry,
  }, 0);
  if (mediaSprite) {
    tl.set(mediaSprite, {
      x: mediaRest.x,
      y: mediaRest.y,
      alpha: 0,
    }, 0);
    tl.set(mediaSprite.scale, { x: mediaRest.scale, y: mediaRest.scale }, 0);
  }

  tl.to(geometryState, {
    innerR: hoverInner,
    outerR: hoverOuter,
    duration: config.hoverDuration,
    ease: config.hoverSegmentEase || 'power2.out',
    onUpdate: updateGeometry,
  }, 0);

  tl.to(container, {
    x: hoverTarget.x,
    y: hoverTarget.y,
    duration: config.hoverDuration,
    ease: config.hoverSegmentEase || 'power2.out',
  }, 0);

  if (mediaSprite) {
    tl.to(mediaSprite, {
      alpha: 1,
      duration: config.mediaFadeDuration ?? 0.45,
      delay: config.mediaFadeDelay ?? 0.04,
      ease: config.mediaFadeEase || 'power2.out',
    }, 0);
    tl.to(mediaSprite, {
      x: hoverMediaX,
      y: hoverMediaY,
      duration: config.hoverDuration,
      ease: config.hoverSegmentEase || 'power2.out',
    }, 0);
  }

  tl.addLabel('hover');

  tl.to(geometryState, {
    innerR: openInner,
    outerR: openOuter,
    duration: config.clickDuration,
    ease: config.openSegmentEase || 'expo.in',
    onUpdate: updateGeometry,
  }, 'hover');

  if (mediaSprite) {
    tl.to(mediaSprite, {
      x: openMediaX,
      y: openMediaY,
      duration: config.clickDuration,
      ease: config.openSegmentEase || 'expo.in',
    }, 'hover');
    tl.to(mediaSprite.scale, {
      x: mediaRest.scale,
      y: mediaRest.scale,
      duration: config.clickDuration,
      ease: config.openSegmentEase || 'expo.in',
    }, 'hover');
    tl.to(mediaSprite, {
      alpha: 0,
      duration: Math.min(0.95, Math.max(0.62, config.clickDuration * 0.42)),
      ease: 'sine.inOut',
    }, `hover+=${Math.max(0, config.clickDuration * 0.38)}`);
  }

  tl.addLabel('open');
  tl.pause(0);
  updateGeometry();

  const motion = { timeline: tl, tween: null, overlay, configKey, draw: updateGeometry };
  pixi.motion = motion;
  return motion;
}

export function tweenPortalTo(pixi, overlay, config, label, vars = {}) {
  const motion = ensurePortalMotion(pixi, overlay, config);
  if (motion.targetLabel === label && motion.tween?.isActive?.()) {
    return motion.tween;
  }
  if (motion.tween) {
    motion.tween.kill();
  }
  motion.targetLabel = label;
  motion.tween = motion.timeline.tweenTo(label, {
    overwrite: 'auto',
    ...vars,
    onComplete: (...args) => {
      motion.targetLabel = null;
      vars.onComplete?.(...args);
    },
  });
  return motion.tween;
}

export function seekPortalState(pixi, overlay, config, label) {
  const motion = ensurePortalMotion(pixi, overlay, config);
  if (motion.tween) {
    motion.tween.kill();
    motion.tween = null;
  }
  motion.targetLabel = null;
  motion.timeline.pause();
  motion.timeline.seek(label, false);
  motion.draw?.();
}
