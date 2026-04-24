import { useEffect, useCallback } from 'react';
import gsap from 'gsap';
import usePortalStore from '../store/portalStore';
import { getDestinationElements } from '../components/DestinationFrame';
import { seekPortalState, tweenPortalTo } from '../lib/portalMotion';
import { getPortalMotionConfig } from '../config/motion';
import {
  openDestinationFrame,
  resetDestinationFrame,
} from '../lib/destinationFrameController';

/**
 * @param {React.RefObject} overlayRef - the .portal-overlay hit-box
 * @param {number} portalId - this portal's ID
 * @param {string} href - destination URL
 * @param {React.RefObject} systemRef - the #portal-system container
 */
export default function usePortalTransition(
  overlayRef,
  portalId,
  href,
  systemRef
) {
  const openPortal = useCallback(() => {
    const store = usePortalStore.getState();
    if (store.transitionPhase !== 'idle' || !href) return;

    store.openPortal(portalId, href);

    const overlay = overlayRef.current;
    const system = systemRef.current;
    const pixi = store.getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig();

    if (!overlay || !pixi) return;

    const { container } = pixi;

    overlay.style.zIndex = '999';
    overlay.style.pointerEvents = 'none';
    overlay.classList.add('is-active');

    if (container && container.parent) {
      container.parent.addChild(container);
    }

    const { frame: destFrame } = getDestinationElements();

    const showDestination = () => {
      if (!destFrame) return;
      gsap.set(destFrame, { opacity: 1, visibility: 'visible' });
      destFrame.classList.add('is-active');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (system) system.style.visibility = 'hidden';
          try {
            history.pushState({ portalId }, '', href);
          } catch (_) {
            history.pushState({ portalId }, '', `#portal-${portalId}`);
          }
          usePortalStore.getState().setPortalOpen();
        });
      });
    };

    tweenPortalTo(pixi, overlay, motionConfig, 'open', {
      duration: motionConfig.openDuration,
      ease: motionConfig.openEase,
      onComplete: () => {
        openDestinationFrame(href, {
          onReady: showDestination,
          onTimeout: (target) => {
            const win = window.open(
              target.absoluteHref,
              '_blank',
              'noopener,noreferrer'
            );
            if (!win) {
              window.location.href = target.absoluteHref;
            }
          },
        });
      },
    });
  }, [overlayRef, portalId, href, systemRef]);

  return { openPortal };
}

/**
 * useBackNavigation - popstate listener for reverse portal animation.
 */
export function useBackNavigation(systemRef) {
  useEffect(() => {
    const handlePopState = (event) => {
      const { frame: destFrame } = getDestinationElements();
      if (!destFrame || !destFrame.classList.contains('is-active')) return;

      const store = usePortalStore.getState();
      const motionConfig = getPortalMotionConfig();
      store.startClosing();

      const portalId =
        event.state?.portalId || store.activePortalId || store.getBackNavEntry()?.id;

      const system = systemRef.current;
      const pixi = store.getPixiPortal(portalId);

      if (!portalId || !pixi) {
        destFrame.classList.remove('is-active');
        gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });
        if (system) system.style.visibility = '';
        store.closePortal();
        return;
      }

      const overlay = system?.querySelector(`[data-portal-id="${portalId}"]`);

      if (system) {
        system.style.visibility = '';
        system.querySelectorAll('.portal-overlay').forEach((node) => {
          node.style.pointerEvents = 'none';
        });
      }

      seekPortalState(pixi, overlay, motionConfig, 'open');

      destFrame.classList.remove('is-active');
      gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });

      const finishBack = () => {
        if (overlay) {
          overlay.classList.remove('is-active');
          overlay.style.zIndex = '';
          overlay.style.pointerEvents = '';
        }
        store.closePortal();
        resetDestinationFrame();
      };

      tweenPortalTo(pixi, overlay, motionConfig, 'rest', {
        duration: motionConfig.backDuration,
        ease: motionConfig.backEase,
        onComplete: finishBack,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [systemRef]);
}
