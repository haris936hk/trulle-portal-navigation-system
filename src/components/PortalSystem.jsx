/**
 * PortalSystem.jsx
 * Main container - renders the SVG artwork, portal overlays,
 * and destination frame. Coordinates refs between SVG rings
 * and interactive overlays.
 */

import { useRef } from 'react';
import SVGArtwork from './SVGArtwork';
import PixiPortalLayer from './PixiPortalLayer';
import Portal from './Portal';
import DestinationFrame from './DestinationFrame';
import { useBackNavigation } from '../hooks/usePortalTransition';
import usePerfProbe from '../hooks/usePerfProbe';

export default function PortalSystem({ portals }) {
  const systemRef = useRef(null);

  useBackNavigation(systemRef);
  usePerfProbe();

  return (
    <div id="portal-system" ref={systemRef}>
      <SVGArtwork />
      <PixiPortalLayer portals={portals} />

      {portals
        .filter((p) => p.href)
        .map((p) => (
          <Portal
            key={p.id}
            portal={p}
            systemRef={systemRef}
          />
        ))}

      <DestinationFrame />
    </div>
  );
}
