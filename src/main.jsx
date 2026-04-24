/**
 * main.jsx
 * Entry point: mounts the React portal system.
 *
 * Configuration sources (later sources win per portal id):
 * 1) data-portals='[{"id":1,"href":"..."}]'
 * 2) data-portal-1-href / data-portal-1-video / data-portal-1-label
 * 3) Elementor link widgets with custom attribute data-portal-id|1
 *    - href comes from the widget link URL
 *    - optional data-portal-video / data-portal-label
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
    href: typeof raw.href === 'string' ? raw.href.trim() : '',
    video: typeof raw.video === 'string' ? raw.video.trim() : '',
    label: typeof raw.label === 'string' ? raw.label.trim() : '',
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
    const href = container.getAttribute(`data-portal-${id}-href`)?.trim() || '';
    const video = container.getAttribute(`data-portal-${id}-video`)?.trim() || '';
    const label = container.getAttribute(`data-portal-${id}-label`)?.trim() || '';
    if (!href && !video && !label) continue;
    overrides.push({ id, href, video, label });
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

    const href =
      node.getAttribute('data-portal-href')?.trim() ||
      node.getAttribute('href')?.trim() ||
      '';
    const video = node.getAttribute('data-portal-video')?.trim() || '';
    const label =
      node.getAttribute('data-portal-label')?.trim() ||
      node.getAttribute('aria-label')?.trim() ||
      node.textContent?.trim() ||
      '';

    if (!href && !video && !label) return;
    overrides.push({ id, href, video, label });
  });

  return overrides;
}

function mergePortalOverrides(...groups) {
  const byId = new Map();

  groups.flat().forEach((entry) => {
    const normalized = normalizePortalOverride(entry);
    if (!normalized) return;
    const prev = byId.get(normalized.id) || { id: normalized.id };
    byId.set(normalized.id, {
      ...prev,
      ...normalized,
    });
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
  const container = document.getElementById('trulle-portal-root');
  if (!container) return;

  const portalOverrides = readPortalOverrides(container);

  createRoot(container).render(
    <StrictMode>
      <App portalOverrides={portalOverrides} />
    </StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
