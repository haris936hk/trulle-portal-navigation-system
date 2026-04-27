import { useEffect, useRef } from 'react';
import { Application, Assets, Sprite, Graphics, Container, Texture } from 'pixi.js';
import gsap from 'gsap';
import usePortalStore from '../store/portalStore';
import { getMediaKind, toAbsoluteHref } from '../lib/mediaEmbed';

const DESIGN_W = 3840;
const DESIGN_H = 2160;

function resolvePreviewSource(portal) {
  if (portal.video) {
    return { kind: 'video', url: toAbsoluteHref(portal.video) };
  }
  const kind = getMediaKind(portal.href || '');
  if (!kind) return null;
  return { kind, url: toAbsoluteHref(portal.href) };
}

function coverLayout(srcW, srcH) {
  if (!srcW || !srcH) {
    return {
      scale: 1,
      x: 0,
      y: 0,
    };
  }

  const scale = Math.max(DESIGN_W / srcW, DESIGN_H / srcH);
  const bgW = srcW * scale;
  const bgH = srcH * scale;

  return {
    scale,
    x: (DESIGN_W - bgW) * 0.5,
    y: (DESIGN_H - bgH) * 0.5,
  };
}

async function loadVideoTexture(url) {
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load video: ${url}`));
    };
    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('loadeddata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.load();
  });

  try {
    await video.play();
  } catch (_) {
    // Autoplay may be blocked in some contexts.
  }

  return {
    texture: Texture.from(video),
    videoEl: video,
  };
}

export default function PixiPortalLayer({ portals }) {
  const containerRef = useRef(null);
  const videoMapRef = useRef(new Map());
  const hoveredPortalId = usePortalStore((s) => s.hoveredPortalId);
  const activePortalId = usePortalStore((s) => s.activePortalId);
  const PORTAL_BG_COLOR = 0xfcfcfc;

  useEffect(() => {
    let app;
    let isDestroyed = false;
    let resizeObserver = null;
    let onWindowResize = null;
    let renderViaGsap = null;
    const store = usePortalStore.getState();
    const cleanupVideos = [];

    store.resetPixiPortals();

    const initPixi = async () => {
      const appInstance = new Application();
      try {
        await appInstance.init({
          width: Math.max(1, Math.round(containerRef.current?.clientWidth || window.innerWidth || DESIGN_W)),
          height: Math.max(1, Math.round(containerRef.current?.clientHeight || window.innerHeight || DESIGN_H)),
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          sharedTicker: false,
          powerPreference: 'high-performance',
        });

        if (isDestroyed) {
          appInstance.destroy({ removeView: true });
          return;
        }

        app = appInstance;
      } catch (err) {
        console.error('Pixi init failed', err);
        return;
      }

      app.canvas.style.position = 'absolute';
      app.canvas.style.inset = '0';
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.pointerEvents = 'none';
        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas);
        }

        const world = new Container();
        app.stage.addChild(world);

        const resizeToHost = () => {
          const host = containerRef.current;
          if (!host || !app) return;
          const nextW = Math.max(1, Math.round(host.clientWidth || window.innerWidth || DESIGN_W));
          const nextH = Math.max(1, Math.round(host.clientHeight || window.innerHeight || DESIGN_H));
          app.renderer.resize(nextW, nextH);
          world.scale.set(nextW / DESIGN_W, nextH / DESIGN_H);
        };

        resizeToHost();
        onWindowResize = () => resizeToHost();
        window.addEventListener('resize', onWindowResize, { passive: true });
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => resizeToHost());
          resizeObserver.observe(containerRef.current);
        }

        // Use one animation driver (GSAP ticker) to avoid dual RAF loops
        // from Pixi ticker + GSAP ticker running in parallel.
        app.stop();
        renderViaGsap = () => {
          if (!app || isDestroyed) return;
          app.render();
        };
        gsap.ticker.add(renderViaGsap);

      const mediaPromises = portals.map(async (portal) => {
        const source = resolvePreviewSource(portal);
        if (!source) return { id: portal.id, media: null };

        try {
          if (source.kind === 'video') {
            const videoMedia = await loadVideoTexture(source.url);
            return {
              id: portal.id,
              media: {
                ...videoMedia,
                kind: 'video',
              },
            };
          }

          const texture = await Assets.load(source.url);
          return {
            id: portal.id,
            media: {
              texture,
              kind: 'image',
            },
          };
        } catch (e) {
          console.error('Failed to load preview source', source.url, e);
          return { id: portal.id, media: null };
        }
      });

      const loadedMedia = await Promise.all(mediaPromises);
      const mediaMap = {};
      loadedMedia.forEach((item) => {
        mediaMap[item.id] = item.media;
      });

      if (isDestroyed) return;

      portals.forEach((portal) => {
        const x = portal.cx;
        const y = portal.cy;
        const portalContainer = new Container();
        portalContainer.position.set(x, y);
          world.addChild(portalContainer);

        const gapCover = new Graphics();
        gapCover.circle(0, 0, portal.outerR - 3.25);
        gapCover.fill({ color: PORTAL_BG_COLOR });
        gapCover.position.set(0, 0);
        portalContainer.addChild(gapCover);

        let mediaSprite = null;
        let mediaRestX = 0;
        let mediaRestY = 0;
        let mediaBaseScale = 1;

        const media = mediaMap[portal.id];
        if (media?.texture) {
          const srcW = media.texture.width;
          const srcH = media.texture.height;
          const layout = coverLayout(srcW, srcH);

          mediaBaseScale = layout.scale;
          mediaRestX = layout.x - x;
          mediaRestY = layout.y - y;

          mediaSprite = new Sprite(media.texture);
          mediaSprite.anchor.set(0);
          mediaSprite.position.set(mediaRestX, mediaRestY);
          mediaSprite.scale.set(mediaBaseScale);
          mediaSprite.alpha = 0;
          portalContainer.addChild(mediaSprite);

          if (media.videoEl) {
            cleanupVideos.push(media.videoEl);
            videoMapRef.current.set(portal.id, media.videoEl);
          }
        }

        const maskGraphics = new Graphics();
        maskGraphics.circle(0, 0, portal.innerR);
        maskGraphics.fill({ color: 0xffffff });
        maskGraphics.position.set(0, 0);
        portalContainer.addChild(maskGraphics);

        if (mediaSprite) {
          mediaSprite.mask = maskGraphics;
        }

        const ringsContainer = new Container();
        portalContainer.addChild(ringsContainer);

        const outerRing = new Graphics();
        const innerRing = new Graphics();

        outerRing.position.set(0, 0);
        innerRing.position.set(0, 0);

        ringsContainer.addChild(outerRing);
        ringsContainer.addChild(innerRing);

        outerRing.circle(0, 0, portal.outerR);
        outerRing.stroke({ width: 6.5, color: 0x1a1a1a, alignment: 0.5 });

        innerRing.circle(0, 0, portal.innerR);
        innerRing.stroke({ width: 6.5, color: 0x1a1a1a, alignment: 0.5 });

        store.setPixiPortal(portal.id, {
          innerRing,
          outerRing,
          mask: maskGraphics,
          gapCover,
          ringStrokeWidth: 6.5,
          ringColor: 0x1a1a1a,
          portalBgColor: PORTAL_BG_COLOR,
          mediaSprite,
          container: portalContainer,
          basePosition: { x, y },
          baseRadii: { outer: portal.outerR, inner: portal.innerR },
          mediaRest: { x: mediaRestX, y: mediaRestY, scale: mediaBaseScale },
        });
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      usePortalStore.getState().resetPixiPortals();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (onWindowResize) {
        window.removeEventListener('resize', onWindowResize);
        onWindowResize = null;
      }
      if (renderViaGsap) {
        gsap.ticker.remove(renderViaGsap);
        renderViaGsap = null;
      }

      cleanupVideos.forEach((video) => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (_) {
          // no-op cleanup fallback
        }
      });
      videoMapRef.current.clear();

      if (app) {
        app.destroy({
          removeView: true,
          children: true,
          texture: true,
          baseTexture: true,
        });
      }
    };
  }, [portals]);

  useEffect(() => {
    const focusedPortalId = activePortalId ?? hoveredPortalId ?? null;
    videoMapRef.current.forEach((video, id) => {
      if (id === focusedPortalId) {
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else if (!video.paused) {
        video.pause();
      }
    });
  }, [hoveredPortalId, activePortalId]);

  useEffect(() => {
    const focusedPortalId = activePortalId ?? hoveredPortalId ?? null;
    if (!focusedPortalId) return;

    const focused = usePortalStore.getState().getPixiPortal(focusedPortalId);
    const container = focused?.container;
    if (!container?.parent) return;

    // Always render focused (hovered/active) portal above adjacent portals.
    container.parent.addChild(container);
  }, [hoveredPortalId, activePortalId]);

  return (
    <div
      ref={containerRef}
      className="pixi-portal-layer"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
