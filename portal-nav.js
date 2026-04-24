/**
 * DEPRECATED LEGACY RUNTIME
 * This file is backward-compatibility only.
 * Source of truth is React + PixiJS IIFE (`dist/portal-nav.iife.js`)
 * mounted on `#trulle-portal-root` with `data-portals` JSON.
 *
 * portal-nav.js
 * Portal Navigation System — WordPress / Elementor
 *
 * Deps:  GSAP 3.13+ (free, all plugins) via CDN
 * Stack: Vanilla JS — no framework, no other libraries
 *
 * Portal overlay data attributes:
 *   data-portal-id    — matches SVG ring data-portal-outer/inner attrs
 *   data-href         — destination page URL
 *   data-thumbnail    — (optional) image URL shown while iframe loads
 *   data-video        — (optional) mp4 URL shown on hover peek (overrides iframe)
 */

(function () {
  'use strict';

  // ─── Config ─────────────────────────────────────────────────────────────────
  const HOVER_SCALE       = 4.2;
  const HOVER_DURATION    = 0.65;
  const CLICK_DURATION    = 2.0;
  const BACK_DURATION     = 1.15;
  const IFRAME_RENDER_W   = 1400;   // iframe renders at this width
  const IFRAME_RENDER_H   = 900;    // iframe renders at this height

  let isNavigating        = false;
  let activePortalId      = null;
  let preloadedHref       = null;
  let destIframeLoaded    = false;

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const system = document.getElementById('portal-system');
    if (!system) return;

    const portals = Array.from(system.querySelectorAll('.portal-overlay'));
    if (!portals.length) return;

    ensureDestinationFrame();

    requestAnimationFrame(() => {
      setupPortals(system, portals);
      setupBackNavigation(system);
    });
  }

  // ─── Destination frame management ──────────────────────────────────────────
  function ensureDestinationFrame() {
    if (document.getElementById('portal-destination-frame')) return;
    const frame = document.createElement('div');
    frame.id = 'portal-destination-frame';
    const iframe = document.createElement('iframe');
    iframe.id = 'portal-destination-iframe';
    frame.appendChild(iframe);
    document.body.appendChild(frame);
  }

  function getDestinationFrame() {
    return document.getElementById('portal-destination-frame');
  }

  function getDestinationIframe() {
    return document.getElementById('portal-destination-iframe');
  }

  function preloadDestination(href) {
    if (preloadedHref === href) return;
    const iframe = getDestinationIframe();
    if (!iframe) return;
    destIframeLoaded = false;
    iframe.onload = () => { destIframeLoaded = true; };
    iframe.src = href;
    preloadedHref = href;
  }

  // ─── Setup ──────────────────────────────────────────────────────────────────
  function setupPortals(system, portals) {
    portals.forEach(portal => {
      const id    = portal.dataset.portalId;
      const href  = portal.dataset.href;

      if (!href) return;

      gsap.set(portal, { xPercent: -50, yPercent: -50 });

      const wrap = portal.querySelector('.portal-media');
      if (wrap) {
        gsap.set(wrap, { opacity: 0 });

        // Build a clip-path polygon from the SVG inner ring path
        // so media clips to the actual oval shape (including any tilt).
        const innerRing = system.querySelector(`[data-portal-inner="${id}"]`);
        if (innerRing) {
          applyOvalClip(portal, wrap, innerRing);
        }
      }

      const portalRings = getRings(system, id);

      portal.addEventListener('mouseenter', () => hoverIn(portal, portalRings));
      portal.addEventListener('mouseleave', () => hoverOut(portal, portalRings));

      portal.addEventListener('click', (e) => {
        e.preventDefault();
        openPortal(portal, system, id, href);
      });

      portal.setAttribute('role', 'link');
      portal.setAttribute('tabindex', '0');
      portal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPortal(portal, system, id, href);
        }
      });
    });
  }

  // ─── Media injection ────────────────────────────────────────────────────────
  function injectMedia(portal) {
    const wrap = portal.querySelector('.portal-media');
    if (!wrap || wrap.children.length > 0) return;

    const href     = portal.dataset.href;
    const videoSrc = portal.dataset.video;
    const imgSrc   = portal.dataset.thumbnail;

    if (videoSrc) {
      // Video takes priority — no iframe needed
      const v = document.createElement('video');
      v.src         = videoSrc;
      v.autoplay    = true;
      v.muted       = true;
      v.loop        = true;
      v.playsInline = true;
      wrap.appendChild(v);
    } else if (href) {
      // Live page preview: large iframe scaled to fit portal
      const portalW = portal.offsetWidth;
      const portalH = portal.offsetHeight;
      const scaleX  = portalW / IFRAME_RENDER_W;
      const scaleY  = portalH / IFRAME_RENDER_H;
      const scale   = Math.max(scaleX, scaleY); // cover

      // Show thumbnail immediately as fallback
      if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        wrap.appendChild(img);
      }

      const iframe = document.createElement('iframe');
      iframe.src = href;
      iframe.setAttribute('scrolling', 'no');
      iframe.style.cssText = [
        'position:absolute',
        'top:50%', 'left:50%',
        `width:${IFRAME_RENDER_W}px`,
        `height:${IFRAME_RENDER_H}px`,
        `transform:translate(-50%,-50%) scale(${scale})`,
        'transform-origin:center center',
        'opacity:0'
      ].join(';');

      iframe.onload = () => {
        gsap.to(iframe, { opacity: 1, duration: 0.5 });
      };

      wrap.appendChild(iframe);
    } else if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      wrap.appendChild(img);
    }
  }

  // ─── Clip path from SVG geometry ─────────────────────────────────────────
  // Samples points along the SVG inner ring path, converts them to
  // the overlay's local percentage space, and applies clip-path: polygon().
  function applyOvalClip(portal, wrap, svgPath) {
    try {
      const totalLen = svgPath.getTotalLength();
      const samples  = 48;  // enough points for a smooth ellipse
      const svg      = svgPath.ownerSVGElement;
      const svgRect  = svg.getBoundingClientRect();
      const portalRect = portal.getBoundingClientRect();

      // SVG viewBox → screen scale factors
      const vb       = svg.viewBox.baseVal;
      const svgScaleX = svgRect.width  / vb.width;
      const svgScaleY = svgRect.height / vb.height;

      const points = [];
      for (let i = 0; i < samples; i++) {
        const pt = svgPath.getPointAtLength((i / samples) * totalLen);
        // SVG viewBox coords → screen coords
        const screenX = svgRect.left + pt.x * svgScaleX;
        const screenY = svgRect.top  + pt.y * svgScaleY;
        // screen coords → portal-local percentages
        const pctX = ((screenX - portalRect.left) / portalRect.width) * 100;
        const pctY = ((screenY - portalRect.top)  / portalRect.height) * 100;
        points.push(`${pctX.toFixed(2)}% ${pctY.toFixed(2)}%`);
      }

      wrap.style.clipPath = `polygon(${points.join(', ')})`;
    } catch (_) {
      // Fallback: generic ellipse
      wrap.style.clipPath = 'ellipse(50% 50% at 50% 50%)';
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function getRings(system, id) {
    const rings = Array.from(system.querySelectorAll(
      `[data-portal-outer="${id}"], [data-portal-inner="${id}"]`
    ));

    // Compute shared SVG origin from the outer ring's bounding box
    // so both rings scale from the same point and stay aligned.
    let svgOrigin = null;
    const outer = system.querySelector(`[data-portal-outer="${id}"]`);
    if (outer && typeof outer.getBBox === 'function') {
      try {
        const bbox = outer.getBBox();
        const cx = Math.round(bbox.x + bbox.width / 2);
        const cy = Math.round(bbox.y + bbox.height / 2);
        svgOrigin = `${cx} ${cy}`;
      } catch (_) { /* element not rendered yet */ }
    }

    return { rings, svgOrigin };
  }

  // ─── Hover ──────────────────────────────────────────────────────────────────
  function hoverIn(portal, { rings, svgOrigin }) {
    if (isNavigating) return;

    injectMedia(portal);
    preloadDestination(portal.dataset.href);

    const media = portal.querySelector('.portal-media');

    gsap.to(portal, {
      scale: HOVER_SCALE,
      duration: HOVER_DURATION,
      ease: 'power2.out',
      overwrite: 'auto'
    });

    if (media) {
      gsap.to(media, {
        opacity: 1,
        duration: 0.35,
        delay: 0.12,
        overwrite: 'auto'
      });
    }

    if (rings.length) {
      const originProp = svgOrigin ? { svgOrigin } : { transformOrigin: '50% 50%' };
      gsap.to(rings, {
        scale: HOVER_SCALE,
        duration: HOVER_DURATION,
        ...originProp,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  }

  function hoverOut(portal, { rings, svgOrigin }) {
    if (isNavigating) return;
    const media = portal.querySelector('.portal-media');

    gsap.to(portal, {
      scale: 1,
      duration: 0.55,
      ease: 'power2.inOut',
      overwrite: 'auto'
    });

    if (media) {
      gsap.to(media, {
        opacity: 0,
        duration: 0.28,
        overwrite: 'auto'
      });
    }

    if (rings.length) {
      const originProp = svgOrigin ? { svgOrigin } : { transformOrigin: '50% 50%' };
      gsap.to(rings, {
        scale: 1,
        duration: 0.55,
        ...originProp,
        ease: 'power2.inOut',
        overwrite: 'auto'
      });
    }
  }

  // ─── Open portal (click → seamless transition) ──────────────────────────────
  function openPortal(portal, system, id, href) {
    if (isNavigating) return;

    system.querySelectorAll('.portal-overlay').forEach(p => {
      p.style.pointerEvents = 'none';
    });

    isNavigating = true;
    activePortalId = id;
    portal.classList.add('is-active');

    injectMedia(portal);
    preloadDestination(href);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // offsetWidth/Height exclude CSS transforms — gives natural layout size
    const naturalW = portal.offsetWidth;
    const naturalH = portal.offsetHeight;

    // Scale needed so the portal (at natural size) covers the full viewport
    const targetScale = Math.ceil(
      Math.max(vw * 2 / naturalW, vh * 2 / naturalH)
    );

    const destFrame = getDestinationFrame();
    const { rings, svgOrigin } = getRings(system, id);
    const media = portal.querySelector('.portal-media');

    const tl = gsap.timeline({
      onComplete: () => {
        const showDestination = () => {
          if (destFrame) {
            gsap.fromTo(destFrame,
              { opacity: 0, visibility: 'visible' },
              {
                opacity: 1,
                duration: 0.35,
                ease: 'power1.in',
                onComplete: () => {
                  destFrame.classList.add('is-active');
                  system.style.visibility = 'hidden';
                  history.pushState({ portalId: id }, '', href);
                  isNavigating = false;
                }
              }
            );
          }
        };

        if (destIframeLoaded) {
          showDestination();
        } else {
          const iframe = getDestinationIframe();
          if (iframe) {
            iframe.addEventListener('load', showDestination, { once: true });
          }
        }
      }
    });

    // Expand portal — overwrite hover tweens
    tl.to(portal, {
      scale: targetScale,
      duration: CLICK_DURATION,
      ease: "expo.in",
      overwrite: true
    }, 0);

    // Expand rings from shared SVG origin
    if (rings.length) {
      const originProp = svgOrigin ? { svgOrigin } : { transformOrigin: '50% 50%' };
      tl.to(rings, {
        scale: targetScale,
        duration: CLICK_DURATION,
        ...originProp,
        ease: "expo.in",
        overwrite: true
      }, 0);
    }

    // Ensure media visible during expansion
    if (media) {
      tl.to(media, {
        opacity: 1,
        duration: 0.3,
        overwrite: true
      }, 0);
    }

    // No border-radius animation — circle stays circular.
    // At max scale the circle far exceeds the viewport, so edges are not visible.
  }

  // ─── Back navigation (popstate) ─────────────────────────────────────────────
  function setupBackNavigation(system) {
    window.addEventListener('popstate', () => {
      const destFrame = getDestinationFrame();
      if (!destFrame || !destFrame.classList.contains('is-active')) return;

      const portalId = activePortalId;

      if (!portalId) {
        destFrame.classList.remove('is-active');
        gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });
        system.style.visibility = '';
        return;
      }

      const portal = system.querySelector(`[data-portal-id="${portalId}"]`);
      if (!portal) {
        destFrame.classList.remove('is-active');
        gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });
        system.style.visibility = '';
        return;
      }

      system.style.visibility = '';

      const naturalW = portal.offsetWidth;
      const naturalH = portal.offsetHeight;
      const bigScale = Math.ceil(
        Math.max(
          window.innerWidth  * 2 / naturalW,
          window.innerHeight * 2 / naturalH
        )
      );

      gsap.set(portal, { scale: bigScale });

      const media = portal.querySelector('.portal-media');
      if (media) gsap.set(media, { opacity: 1 });

      const { rings, svgOrigin: backOrigin } = getRings(system, portalId);
      if (rings.length) {
        const originProp = backOrigin ? { svgOrigin: backOrigin } : { transformOrigin: '50% 50%' };
        gsap.set(rings, { scale: bigScale, ...originProp });
      }

      destFrame.classList.remove('is-active');
      gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });

      const tl = gsap.timeline({
        onComplete: () => {
          portal.classList.remove('is-active');
          activePortalId = null;
          isNavigating = false;

          system.querySelectorAll('.portal-overlay').forEach(p => {
            p.style.pointerEvents = '';
          });

          preloadedHref = null;
          destIframeLoaded = false;
          const iframe = getDestinationIframe();
          if (iframe) iframe.src = 'about:blank';
        }
      });

      tl.to(portal, {
        scale: 1,
        duration: BACK_DURATION,
        ease: 'power3.inOut'
      });

      if (media) {
        tl.to(media, {
          opacity: 0,
          duration: BACK_DURATION * 0.8,
          ease: 'power3.inOut'
        }, 0);
      }

      if (rings.length) {
        const originProp = backOrigin ? { svgOrigin: backOrigin } : { transformOrigin: '50% 50%' };
        tl.to(rings, {
          scale: 1,
          duration: BACK_DURATION,
          ...originProp,
          ease: 'power3.inOut'
        }, 0);
      }
    });
  }

})();
