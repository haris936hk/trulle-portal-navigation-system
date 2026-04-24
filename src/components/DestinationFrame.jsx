/**
 * DestinationFrame.jsx
 * Full-viewport iframe overlay for seamless portal-to-page transitions.
 * Managed by the portal store — shows the preloaded destination page.
 */

import { useRef } from 'react';

export default function DestinationFrame() {
  const frameRef = useRef(null);
  const iframeRef = useRef(null);

  return (
    <div id="portal-destination-frame" ref={frameRef}>
      <iframe
        id="portal-destination-iframe"
        ref={iframeRef}
      />
    </div>
  );
}

/**
 * Helper: get the destination frame + iframe DOM elements.
 * Used by animation hooks that need direct DOM access.
 */
export function getDestinationElements() {
  return {
    frame: document.getElementById('portal-destination-frame'),
    iframe: document.getElementById('portal-destination-iframe'),
  };
}
