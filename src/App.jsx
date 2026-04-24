/**
 * App.jsx
 * Root component — loads portal configuration and renders the system.
 */

import { useMemo } from 'react';
import PortalSystem from './components/PortalSystem';
import PORTALS from './config/portals';
import './styles/portal-nav.css';

function normalizePortalHref(href) {
  return typeof href === 'string' ? href.trim() : '';
}

export default function App({ portalOverrides }) {
  // Merge static geometry with any runtime overrides (from WordPress data attrs)
  const portals = useMemo(() => {
    if (!portalOverrides || !portalOverrides.length) return PORTALS;
    return PORTALS.map((p) => {
      const override = portalOverrides.find((o) => o.id === p.id);
      if (!override) return p;
      return {
        ...p,
        href: normalizePortalHref(override.href),
        video: override.video || p.video,
        label: override.label || p.label,
      };
    });
  }, [portalOverrides]);

  return <PortalSystem portals={portals} />;
}
