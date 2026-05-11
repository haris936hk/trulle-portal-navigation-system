/**
 * Full-viewport iframe overlay for seamless portal-to-page transitions.
 */
export default function DestinationFrame({ frameRef, iframeRef }) {
  return (
    <div className="portal-destination-frame" ref={frameRef}>
      <iframe className="portal-destination-iframe" ref={iframeRef} />
    </div>
  );
}

