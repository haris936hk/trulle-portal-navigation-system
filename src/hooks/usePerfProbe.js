import { useEffect } from 'react';

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export default function usePerfProbe() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('portalPerfProbe') !== '1') return;

    let rafId = 0;
    let last = performance.now();
    let sampleStart = last;
    const frameTimes = [];

    const tick = (now) => {
      const dt = now - last;
      last = now;
      frameTimes.push(dt);

      if (now - sampleStart >= 5000) {
        const avg = frameTimes.reduce((sum, v) => sum + v, 0) / frameTimes.length;
        const p95 = percentile(frameTimes, 95);
        const max = Math.max(...frameTimes);
        console.table({
          'Portal Perf (5s)': {
            frames: frameTimes.length,
            avgMs: Number(avg.toFixed(2)),
            p95Ms: Number(p95.toFixed(2)),
            maxMs: Number(max.toFixed(2)),
          },
        });
        frameTimes.length = 0;
        sampleStart = now;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);
}

