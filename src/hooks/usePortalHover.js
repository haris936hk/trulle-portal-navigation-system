import { useCallback } from 'react';
import { usePortalStoreApi } from '../store/portalStore';
import { tweenPortalTo } from '../lib/portalMotion';
import { getPortalMotionConfig } from '../config/motion';
import { usePortalRuntime } from '../store/portalRuntimeContext';

/**
 * @param {React.RefObject} overlayRef - the .portal-overlay div hit-box
 * @param {number} portalId - ID to fetch Pixi objects
 * @param {string} href - destination URL for preloading
 */
export default function usePortalHover(overlayRef, portalId, href) {
  const store = usePortalStoreApi();
  const { destinationController } = usePortalRuntime();

  const preloadDestination = useCallback(() => {
    destinationController.preload(href);
  }, [destinationController, href]);

  const hoverIn = useCallback(() => {
    if (store.getState().transitionPhase !== 'idle') return;

    preloadDestination();

    const overlay = overlayRef.current;
    const pixi = store.getState().getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig(portalId);

    if (!pixi) return;

    tweenPortalTo(pixi, overlay, motionConfig, 'hover', {
      duration: motionConfig.hoverDuration,
      ease: motionConfig.hoverEase,
    });
  }, [overlayRef, portalId, preloadDestination, store]);

  const hoverOut = useCallback(() => {
    if (store.getState().transitionPhase !== 'idle') return;

    const overlay = overlayRef.current;
    const pixi = store.getState().getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig(portalId);

    if (!pixi) return;

    tweenPortalTo(pixi, overlay, motionConfig, 'rest', {
      duration: motionConfig.hoverOutDuration,
      ease: motionConfig.hoverOutEase,
    });
  }, [overlayRef, portalId, store]);

  return { hoverIn, hoverOut };
}
