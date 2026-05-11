/**
 * main.jsx
 * Entry point: mounts the React portal system.
 *
 * Configuration sources (later sources win per portal id):
 * 1) data-portals='[{"id":1,"destination":"...","preview":"..."}]'
 * 2) data-portal-1-destination / data-portal-1-preview / data-portal-1-label
 * 3) Elementor link widgets with custom attribute data-portal-id|1
 *    - destination comes from data-portal-destination
 *    - optional data-portal-preview / data-portal-label
 *    - optional root attribute data-portals-source-selector="#my-map"
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

function normalizePortalOverride(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    destination:
      typeof raw.destination === 'string' ? raw.destination.trim() : undefined,
    preview: typeof raw.preview === 'string' ? raw.preview.trim() : undefined,
    label: typeof raw.label === 'string' ? raw.label.trim() : undefined,
  };
}

function readJsonOverrides(container) {
  const rawJson = container.getAttribute('data-portals');
  if (!rawJson) return [];

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      console.warn('[Trulle Portal] data-portals must be an array.');
      return [];
    }
    return parsed.map(normalizePortalOverride).filter(Boolean);
  } catch (e) {
    console.warn('[Trulle Portal] Invalid data-portals JSON:', e);
    return [];
  }
}

function readAttributeOverrides(container) {
  const overrides = [];
  for (let id = 1; id <= 12; id += 1) {
    const destination =
      container.getAttribute(`data-portal-${id}-destination`)?.trim() || '';
    const preview =
      container.getAttribute(`data-portal-${id}-preview`)?.trim() || '';
    const label = container.getAttribute(`data-portal-${id}-label`)?.trim() || '';
    if (!destination && !preview && !label) continue;
    overrides.push({ id, destination, preview, label });
  }
  return overrides;
}

function readElementorMappedOverrides(container) {
  const sourceSelector = container.getAttribute('data-portals-source-selector')?.trim();
  let root = document;

  if (sourceSelector) {
    const selected = document.querySelector(sourceSelector);
    if (!selected) {
      console.warn(
        '[Trulle Portal] data-portals-source-selector did not match any element:',
        sourceSelector
      );
      return [];
    }
    root = selected;
  }

  const nodes = root.querySelectorAll('[data-portal-id]');
  const overrides = [];

  nodes.forEach((node) => {
    const id = Number(node.getAttribute('data-portal-id'));
    if (!Number.isFinite(id)) return;

    const destination =
      node.getAttribute('data-portal-destination')?.trim() ||
      '';
    const preview =
      node.getAttribute('data-portal-preview')?.trim() || '';
    const label =
      node.getAttribute('data-portal-label')?.trim() ||
      node.getAttribute('aria-label')?.trim() ||
      node.textContent?.trim() ||
      '';

    if (!destination && !preview && !label) return;
    overrides.push({ id, destination, preview, label });
  });

  return overrides;
}

function mergePortalOverrides(...groups) {
  const byId = new Map();

  groups.flat().forEach((entry) => {
    const normalized = normalizePortalOverride(entry);
    if (!normalized) return;
    const prev = byId.get(normalized.id) || { id: normalized.id };
    const next = { ...prev };

    if (normalized.destination !== undefined) next.destination = normalized.destination;
    if (normalized.preview !== undefined) next.preview = normalized.preview;
    if (normalized.label !== undefined) next.label = normalized.label;

    byId.set(normalized.id, next);
  });

  return Array.from(byId.values());
}

function readPortalOverrides(container) {
  return mergePortalOverrides(
    readJsonOverrides(container),
    readAttributeOverrides(container),
    readElementorMappedOverrides(container)
  );
}

function mount() {
  const containers = document.querySelectorAll('[data-trulle-portal-root]');
  if (!containers.length) return;

  containers.forEach((container) => {
    const portalOverrides = readPortalOverrides(container);
    createRoot(container).render(
      <StrictMode>
        <App portalOverrides={portalOverrides} />
      </StrictMode>
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
