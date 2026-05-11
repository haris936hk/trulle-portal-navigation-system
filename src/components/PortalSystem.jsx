/**
 * PortalSystem.jsx
 * Main container - renders the SVG artwork, portal overlays,
 * and destination frame. Coordinates refs between SVG rings
 * and interactive overlays.
 */

import { useEffect, useMemo, useRef } from 'react';
import SVGArtwork from './SVGArtwork';
import PixiPortalLayer from './PixiPortalLayer';
import Portal from './Portal';
import DestinationFrame from './DestinationFrame';
import { useBackNavigation } from '../hooks/usePortalTransition';
import usePerfProbe from '../hooks/usePerfProbe';
import { PortalStoreProvider, usePortalStoreApi } from '../store/portalStore';
import { PortalRuntimeProvider } from '../store/portalRuntimeContext';
import { createDestinationFrameController } from '../lib/destinationFrameController';

export default function PortalSystem({ portals }) {
  return (
    <PortalStoreProvider>
      <PortalSystemInner portals={portals} />
    </PortalStoreProvider>
  );
}

function PortalSystemInner({ portals }) {
  const systemRef = useRef(null);
  const frameRef = useRef(null);
  const iframeRef = useRef(null);
  const store = usePortalStoreApi();
  const instanceIdRef = useRef(`portal-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    store.getState().setInstanceId(instanceIdRef.current);
  }, [store]);

  const destinationController = useMemo(
    () => createDestinationFrameController({
      getIframe: () => iframeRef.current,
      store,
    }),
    [store]
  );
  const runtime = useMemo(
    () => ({
      frameRef,
      iframeRef,
      destinationController,
    }),
    [destinationController]
  );

  return (
    <PortalRuntimeProvider value={runtime}>
      <PortalSystemContent portals={portals} systemRef={systemRef} frameRef={frameRef} iframeRef={iframeRef} />
    </PortalRuntimeProvider>
  );
}

function PortalSystemContent({ portals, systemRef, frameRef, iframeRef }) {
  useBackNavigation(systemRef);
  usePerfProbe();

  return (
    <>
      <div className="portal-system" ref={systemRef}>
        <SVGArtwork />
        <PixiPortalLayer portals={portals} />

        {portals
          .filter((p) => p.destination)
          .map((p) => (
            <Portal
              key={p.id}
              portal={p}
              systemRef={systemRef}
            />
          ))}

        <DestinationFrame frameRef={frameRef} iframeRef={iframeRef} />
      </div>
    </>
  );
}
