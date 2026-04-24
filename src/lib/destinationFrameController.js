import usePortalStore from '../store/portalStore';
import { getDestinationElements } from '../components/DestinationFrame';
import {
  getMediaKind,
  toAbsoluteHref,
  buildMediaDocument,
} from './mediaEmbed';

const OPEN_TIMEOUT_MS = 4000;

let activeRequestId = 0;
let activeResolvedKey = null;
let activeLoadHandler = null;
let activeTimeoutId = null;
let activeReady = false;
let activeReadyCallbacks = [];

function clearLoadListener(iframe) {
  if (iframe && activeLoadHandler) {
    iframe.removeEventListener('load', activeLoadHandler);
  }
  activeLoadHandler = null;
}

function clearOpenWatchdog() {
  if (activeTimeoutId) {
    window.clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }
}

function resetInFlight(iframe) {
  clearLoadListener(iframe);
  clearOpenWatchdog();
  activeReadyCallbacks = [];
}

function resolveTarget(href) {
  const absolute = toAbsoluteHref(href);
  const mediaKind = getMediaKind(absolute);

  if (mediaKind) {
    return {
      key: `media:${mediaKind}:${absolute}`,
      absoluteHref: absolute,
      mode: 'media',
      srcdoc: buildMediaDocument(absolute, mediaKind),
    };
  }

  return {
    key: `url:${absolute}`,
    absoluteHref: absolute,
    mode: 'url',
    src: absolute,
  };
}

function applyTarget(iframe, target) {
  if (target.mode === 'media') {
    iframe.removeAttribute('src');
    iframe.srcdoc = target.srcdoc;
    return;
  }

  iframe.srcdoc = '';
  iframe.src = target.src;
}

function beginLoad(target, onReady) {
  const { iframe } = getDestinationElements();
  if (!iframe) return null;

  resetInFlight(iframe);

  activeRequestId += 1;
  const requestId = activeRequestId;
  activeResolvedKey = target.key;
  activeReady = false;
  activeReadyCallbacks = [];

  // Ensure stale success state never unlocks reveal.
  usePortalStore.setState({ iframeReady: false });
  usePortalStore.getState().setPreloadedHref(target.key);

  activeLoadHandler = () => {
    if (requestId !== activeRequestId) return;
    activeReady = true;
    clearOpenWatchdog();
    usePortalStore.getState().setIframeReady();
    if (onReady) onReady(target);
    activeReadyCallbacks.forEach((cb) => cb(target));
    activeReadyCallbacks = [];
  };

  iframe.addEventListener('load', activeLoadHandler);
  applyTarget(iframe, target);

  return { requestId, target };
}

export function preloadDestinationFrame(href) {
  if (!href) return;
  const target = resolveTarget(href);

  // Avoid duplicate loads for same already-ready target.
  if (activeResolvedKey === target.key && activeReady) {
    return;
  }

  beginLoad(target);
}

export function openDestinationFrame(href, { onReady, onTimeout } = {}) {
  if (!href) return;
  const target = resolveTarget(href);

  // Fast-path already loaded destination.
  if (activeResolvedKey === target.key && activeReady) {
    onReady?.(target);
    return;
  }

  // If the same target is already loading, attach to that in-flight request.
  if (activeResolvedKey === target.key && activeLoadHandler) {
    if (onReady) activeReadyCallbacks.push(onReady);
    const requestId = activeRequestId;
    clearOpenWatchdog();
    activeTimeoutId = window.setTimeout(() => {
      if (requestId !== activeRequestId || activeReady) return;
      clearOpenWatchdog();
      onTimeout?.(target);
    }, OPEN_TIMEOUT_MS);
    return;
  }

  const started = beginLoad(target, onReady);
  if (!started) return;

  const { requestId } = started;
  activeTimeoutId = window.setTimeout(() => {
    if (requestId !== activeRequestId || activeReady) return;
    clearOpenWatchdog();
    onTimeout?.(target);
  }, OPEN_TIMEOUT_MS);
}

export function resetDestinationFrame() {
  const { iframe } = getDestinationElements();
  if (!iframe) return;

  activeRequestId += 1;
  activeResolvedKey = null;
  activeReady = false;

  resetInFlight(iframe);

  iframe.srcdoc = '';
  iframe.src = 'about:blank';
}
