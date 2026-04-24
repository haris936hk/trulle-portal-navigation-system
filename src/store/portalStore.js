/**
 * portalStore.js
 * Zustand store - single source of truth for portal state.
 */

import { create } from 'zustand';

const BACK_NAV_WINDOW = 45_000;

const usePortalStore = create((set, get) => ({
  activePortalId: null,
  isNavigating: false,
  transitionPhase: 'idle', // idle | opening | open | closing
  hoveredPortalId: null,
  iframeReady: false,
  preloadedHref: null,
  pixiPortals: {},

  setPixiPortal: (id, objects) => {
    set((state) => ({
      pixiPortals: {
        ...state.pixiPortals,
        [id]: objects,
      },
    }));
  },

  resetPixiPortals: () => set({ pixiPortals: {} }),

  getPixiPortal: (id) => get().pixiPortals[id],

  openPortal: (id, href) => {
    set({ activePortalId: id, isNavigating: true, transitionPhase: 'opening' });
    try {
      sessionStorage.setItem(
        'portalEntry',
        JSON.stringify({ id, href, ts: Date.now() })
      );
    } catch (_) {
      // Storage can fail in some browsing modes.
    }
  },

  setPortalOpen: () => {
    set({ isNavigating: false, transitionPhase: 'open' });
  },

  startClosing: () => {
    set({
      isNavigating: true,
      transitionPhase: 'closing',
      hoveredPortalId: null,
    });
  },

  closePortal: () => {
    set({
      activePortalId: null,
      isNavigating: false,
      transitionPhase: 'idle',
      hoveredPortalId: null,
      iframeReady: false,
      preloadedHref: null,
    });
  },

  setIframeReady: () => set({ iframeReady: true }),

  setHoveredPortal: (id) => set({ hoveredPortalId: id }),

  setPreloadedHref: (href) => set({ preloadedHref: href }),

  getBackNavEntry: () => {
    try {
      const raw = sessionStorage.getItem('portalEntry');
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > BACK_NAV_WINDOW) return null;
      return entry;
    } catch (_) {
      return null;
    }
  },
}));

export default usePortalStore;
