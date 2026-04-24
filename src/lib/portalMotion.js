import gsap from 'gsap';

const STAGE_W = 3840;
const STAGE_H = 2160;
const EDGE_SAFE_PAD = 20;

function getHoverTarget(pixi, hoverScale) {
  const base = pixi.basePosition || { x: pixi.container.x, y: pixi.container.y };
  const expandedOuterR = (pixi.baseRadii.outer * hoverScale) + EDGE_SAFE_PAD;

  return {
    x: gsap.utils.clamp(expandedOuterR, STAGE_W - expandedOuterR, base.x),
    y: gsap.utils.clamp(expandedOuterR, STAGE_H - expandedOuterR, base.y),
  };
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
  const targetScale = requiredRadius / pixi.baseRadii.outer;
  const base = pixi.basePosition || { x: pixi.container.x, y: pixi.container.y };
  const shiftX = hoverTarget.x - base.x;
  const shiftY = hoverTarget.y - base.y;
  const mediaRest = pixi.mediaRest || { x: 0, y: 0, scale: 1 };
  const hoverMediaScale = mediaRest.scale / config.hoverScale;
  const hoverMediaX = (mediaRest.x - shiftX) / config.hoverScale;
  const hoverMediaY = (mediaRest.y - shiftY) / config.hoverScale;
  const openMediaScale = mediaRest.scale / targetScale;
  const openMediaX = (mediaRest.x - shiftX) / targetScale;
  const openMediaY = (mediaRest.y - shiftY) / targetScale;

  const tl = gsap.timeline({
    paused: true,
    defaults: { overwrite: 'auto' },
  });

  tl.addLabel('rest', 0);
  if (mediaSprite) {
    tl.set(mediaSprite, {
      x: mediaRest.x,
      y: mediaRest.y,
      alpha: 0,
    }, 0);
    tl.set(mediaSprite.scale, {
      x: mediaRest.scale,
      y: mediaRest.scale,
    }, 0);
  }

  tl.to(container.scale, {
    x: config.hoverScale,
    y: config.hoverScale,
    duration: config.hoverDuration,
    ease: config.hoverSegmentEase || 'power2.out',
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
    tl.to(mediaSprite.scale, {
      x: hoverMediaScale,
      y: hoverMediaScale,
      duration: config.hoverDuration,
      ease: config.hoverSegmentEase || 'power2.out',
    }, 0);
  }

  tl.addLabel('hover');

  tl.to(container.scale, {
    x: targetScale,
    y: targetScale,
    duration: config.clickDuration,
    ease: config.openSegmentEase || 'expo.in',
  }, 'hover');

  if (mediaSprite) {
    tl.to(mediaSprite, {
      x: openMediaX,
      y: openMediaY,
      duration: config.clickDuration,
      ease: config.openSegmentEase || 'expo.in',
    }, 'hover');
    tl.to(mediaSprite.scale, {
      x: openMediaScale,
      y: openMediaScale,
      duration: config.clickDuration,
      ease: config.openSegmentEase || 'expo.in',
    }, 'hover');
    tl.to(mediaSprite, {
      alpha: 1,
      duration: 0.3,
      ease: 'none',
    }, 'hover');
  }

  tl.addLabel('open');
  tl.pause(0);

  const motion = { timeline: tl, tween: null, overlay, configKey };
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
}
