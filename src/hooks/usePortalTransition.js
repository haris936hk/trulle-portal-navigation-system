import { useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { usePortalStoreApi } from '../store/portalStore';
import { seekPortalState, tweenPortalTo } from '../lib/portalMotion';
import { getPortalMotionConfig } from '../config/motion';
import { usePortalRuntime } from '../store/portalRuntimeContext';

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
  const store = usePortalStoreApi();
  const { frameRef, destinationController } = usePortalRuntime();

  const openPortal = useCallback(() => {
    if (store.getState().transitionPhase !== 'idle' || !href) return;

    store.getState().openPortal(portalId, href);

    const overlay = overlayRef.current;
    const system = systemRef.current;
    const pixi = store.getState().getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig(portalId);

    if (!overlay || !pixi) return;

    const { container } = pixi;

    overlay.style.zIndex = '999';
    overlay.style.pointerEvents = 'none';
    overlay.classList.add('is-active');

    if (container && container.parent) {
      container.parent.addChild(container);
    }

    const destFrame = frameRef.current;

    const showDestination = () => {
      if (!destFrame) return;
      gsap.killTweensOf(destFrame);
      gsap.set(destFrame, { opacity: 0, visibility: 'visible' });
      destFrame.classList.add('is-active');
      gsap.to(destFrame, {
        opacity: 1,
        duration: 0.85,
        ease: 'sine.inOut',
        onComplete: () => {
          if (system) system.style.visibility = 'hidden';
          try {
            history.pushState({ portalId }, '', href);
          } catch (_) {
            history.pushState({ portalId }, '', `#portal-${portalId}`);
          }
          store.getState().setPortalOpen();
        },
      });
    };

    tweenPortalTo(pixi, overlay, motionConfig, 'open', {
      duration: motionConfig.openDuration,
      ease: motionConfig.openEase,
      onComplete: () => {
        destinationController.open(href, {
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
  }, [destinationController, frameRef, href, overlayRef, portalId, store, systemRef]);

  return { openPortal };
}

/**
 * useBackNavigation - popstate listener for reverse portal animation.
 */
export function useBackNavigation(systemRef) {
  const store = usePortalStoreApi();
  const { frameRef, destinationController } = usePortalRuntime();

  useEffect(() => {
    const handlePopState = (event) => {
      const destFrame = frameRef.current;
      if (!destFrame || !destFrame.classList.contains('is-active')) return;

      store.getState().startClosing();

      const portalId =
        event.state?.portalId ||
        store.getState().activePortalId ||
        store.getState().getBackNavEntry()?.id;
      const motionConfig = getPortalMotionConfig(portalId);

      const system = systemRef.current;
      const pixi = store.getState().getPixiPortal(portalId);

      if (!portalId || !pixi) {
        destFrame.classList.remove('is-active');
        gsap.set(destFrame, { opacity: 0, visibility: 'hidden' });
        if (system) system.style.visibility = '';
        store.getState().closePortal();
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

      gsap.killTweensOf(destFrame);
      destFrame.classList.remove('is-active');
      gsap.to(destFrame, {
        opacity: 0,
        duration: 0.45,
        ease: 'sine.inOut',
        onComplete: () => {
          gsap.set(destFrame, { visibility: 'hidden' });
        },
      });

      const finishBack = () => {
        if (overlay) {
          overlay.classList.remove('is-active');
          overlay.style.zIndex = '';
          overlay.style.pointerEvents = '';
        }
        store.getState().closePortal();
        destinationController.reset();
      };

      tweenPortalTo(pixi, overlay, motionConfig, 'rest', {
        duration: motionConfig.backDuration,
        ease: motionConfig.backEase,
        onComplete: finishBack,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [destinationController, frameRef, store, systemRef]);
}
