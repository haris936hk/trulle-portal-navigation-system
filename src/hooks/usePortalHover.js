import { useCallback } from 'react';
import usePortalStore from '../store/portalStore';
import { tweenPortalTo } from '../lib/portalMotion';
import { getPortalMotionConfig } from '../config/motion';
import { preloadDestinationFrame } from '../lib/destinationFrameController';

/**
 * @param {React.RefObject} overlayRef - the .portal-overlay div hit-box
 * @param {number} portalId - ID to fetch Pixi objects
 * @param {string} href - destination URL for preloading
 */
export default function usePortalHover(overlayRef, portalId, href) {
  const preloadDestination = useCallback(() => {
    preloadDestinationFrame(href);
  }, [href]);

  const hoverIn = useCallback(() => {
    if (usePortalStore.getState().transitionPhase !== 'idle') return;

    preloadDestination();

    const overlay = overlayRef.current;
    const pixi = usePortalStore.getState().getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig();

    if (!pixi) return;

    tweenPortalTo(pixi, overlay, motionConfig, 'hover', {
      duration: motionConfig.hoverDuration,
      ease: motionConfig.hoverEase,
    });
  }, [overlayRef, portalId, preloadDestination]);

  const hoverOut = useCallback(() => {
    if (usePortalStore.getState().transitionPhase !== 'idle') return;

    const overlay = overlayRef.current;
    const pixi = usePortalStore.getState().getPixiPortal(portalId);
    const motionConfig = getPortalMotionConfig();

    if (!pixi) return;

    tweenPortalTo(pixi, overlay, motionConfig, 'rest', {
      duration: motionConfig.hoverOutDuration,
      ease: motionConfig.hoverOutEase,
    });
  }, [overlayRef, portalId]);

  return { hoverIn, hoverOut };
}
