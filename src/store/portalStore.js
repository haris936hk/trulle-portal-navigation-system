/**
 * portalStore.js
 * Per-instance Zustand store for each mounted portal system.
 */

import { createContext, createElement, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';

const BACK_NAV_WINDOW = 45_000;

const createPortalState = (set, get) => ({
  instanceId: '',
  activePortalId: null,
  isNavigating: false,
  transitionPhase: 'idle', // idle | opening | open | closing
  hoveredPortalId: null,
  iframeReady: false,
  preloadedHref: null,
  pixiPortals: {},

  setInstanceId: (instanceId) => set({ instanceId }),

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
      const key = get().instanceId
        ? `portalEntry:${get().instanceId}`
        : 'portalEntry';
      sessionStorage.setItem(
        key,
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
      const key = get().instanceId
        ? `portalEntry:${get().instanceId}`
        : 'portalEntry';
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > BACK_NAV_WINDOW) return null;
      return entry;
    } catch (_) {
      return null;
    }
  },
});

export function createPortalStore() {
  return createStore(createPortalState);
}

const PortalStoreContext = createContext(null);

export function PortalStoreProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = createPortalStore();
  }
  return createElement(
    PortalStoreContext.Provider,
    { value: storeRef.current },
    children
  );
}

export function usePortalStore(selector) {
  const store = useContext(PortalStoreContext);
  if (!store) {
    throw new Error('usePortalStore must be used within PortalStoreProvider');
  }
  return useStore(store, selector);
}

export function usePortalStoreApi() {
  const store = useContext(PortalStoreContext);
  if (!store) {
    throw new Error('usePortalStoreApi must be used within PortalStoreProvider');
  }
  return store;
}
