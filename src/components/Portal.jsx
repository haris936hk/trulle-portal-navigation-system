import { useRef, useCallback } from 'react';
import usePortalHover from '../hooks/usePortalHover';
import usePortalTransition from '../hooks/usePortalTransition';
import { usePortalStore } from '../store/portalStore';

export default function Portal({ portal, systemRef }) {
  const overlayRef = useRef(null);

  const destination = portal.destination || '';
  const transitionPhase = usePortalStore((s) => s.transitionPhase);
  const setHoveredPortal = usePortalStore((s) => s.setHoveredPortal);
  const isInteractive = transitionPhase === 'idle';

  const { hoverIn, hoverOut } = usePortalHover(
    overlayRef,
    portal.id,
    destination
  );

  const { openPortal } = usePortalTransition(
    overlayRef,
    portal.id,
    destination,
    systemRef
  );

  const handleMouseEnter = useCallback(() => {
    if (!destination || !isInteractive) return;
    setHoveredPortal(portal.id);
    hoverIn();
  }, [destination, hoverIn, isInteractive, portal.id, setHoveredPortal]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPortal(null);
    if (!isInteractive) return;
    hoverOut();
  }, [hoverOut, isInteractive, setHoveredPortal]);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    if (!destination || !isInteractive) return;
    setHoveredPortal(null);
    openPortal();
  }, [destination, isInteractive, openPortal, setHoveredPortal]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!destination || !isInteractive) return;
      openPortal();
    }
  }, [destination, isInteractive, openPortal]);

  if (!destination) return null;

  return (
    <div
      ref={overlayRef}
      className="portal-overlay"
      data-portal-id={portal.id}
      style={{
        left: `calc(${(portal.cx / 3840) * 100}% - ${((portal.innerR - 3.25) / 3840) * 100}%)`,
        top: `calc(${(portal.cy / 2160) * 100}% - ${((portal.innerR - 3.25) / 2160) * 100}%)`,
        width: `${((portal.innerR - 3.25) * 2 / 3840) * 100}%`,
        height: `${((portal.innerR - 3.25) * 2 / 2160) * 100}%`,
        pointerEvents: isInteractive ? 'auto' : 'none',
      }}
      role="link"
      tabIndex={0}
      aria-label={portal.label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
}
