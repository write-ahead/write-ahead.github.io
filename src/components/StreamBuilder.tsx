import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

/**
 * Log storage's signature diagram: how a log entry becomes a stream.
 * Click a field to toggle it as a *stream field*. The _stream label and the
 * _stream_id hash recompute live — proving that stream identity depends on the
 * chosen stream fields ONLY, in sorted (canonical) order. Pick a high-cardinality
 * field like trace_id and watch the "stream explosion" warning appear.
 *
 * Drop <StreamBuilder client:visible /> into any chapter.
 */

const NS = 'http://www.w3.org/2000/svg';

interface FieldDef {
  name: string;
  value: string;
  /** high-cardinality: a terrible stream field (unique per line) */
  highCard?: boolean;
}

// a believable structured log line
const FIELDS: FieldDef[] = [
  { name: 'app', value: 'api' },
  { name: 'pod', value: 'api-7' },
  { name: 'level', value: 'error' },
  { name: 'client_ip', value: '1.2.3.4', highCard: true },
  { name: 'trace_id', value: 't-aaa', highCard: true },
  { name: '_msg', value: 'db timeout', highCard: true },
];
const DEFAULT = [true, true, false, false, false, false];

// geometry (viewBox 0 0 600 430)
const CHIP_X = 22, CHIP_W = 268, CHIP_H = 42, CHIP_GAP = 54, CHIP_Y0 = 72;
const OUT_X = 330, OUT_W = 250;

/** FNV-1a, 32-bit → 8 hex. Illustrative, not the engine's real hash128 —
 *  it only needs the right PROPERTY: same tags in, same id out. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export default function StreamBuilder() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [sel, setSel] = useState<boolean[]>(DEFAULT);

  // canonical: keep only selected, sort by name, render Prometheus-style
  const chosen = FIELDS.filter((_, i) => sel[i]).sort((a, b) => a.name.localeCompare(b.name));
  const streamStr = '{' + chosen.map((f) => `${f.name}="${f.value}"`).join(',') + '}';
  const canonical = chosen.map((f) => `${f.name}=${f.value}`).join('\u0001');
  const hash = chosen.length ? fnv1a(canonical) : '00000000';
  const explosion = FIELDS.some((f, i) => sel[i] && f.highCard);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cssVar = (n: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#333';

    function text(
      x: number,
      y: number,
      s: string,
      o: { fill: string; size?: number; anchor?: string; weight?: string; family?: string }
    ) {
      if (!svg) return;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(x));
      t.setAttribute('y', String(y));
      t.setAttribute('fill', o.fill);
      t.setAttribute('font-family', o.family ?? 'var(--font-hand)');
      t.setAttribute('font-size', String(o.size ?? 15));
      t.setAttribute('text-anchor', o.anchor ?? 'start');
      t.setAttribute('font-weight', o.weight ?? '600');
      t.textContent = s;
      svg.appendChild(t);
    }

    function fadeIn(el: SVGElement) {
      if (reduce) return;
      el.style.opacity = '0';
      el.style.transition = 'opacity .4s ease';
      requestAnimationFrame(() => requestAnimationFrame(() => (el.style.opacity = '1')));
    }

    function build() {
      if (!svg) return;
      svg.innerHTML = '';
      const rc = rough.svg(svg);
      const ink = cssVar('--ink');
      const inkSoft = cssVar('--ink-soft');
      const accent = cssVar('--accent');
      const accent2 = cssVar('--accent2');
      const rollback = cssVar('--rollback');
      const panel = cssVar('--panel');
      const line = cssVar('--line');

      // ---- left: the log entry ----
      text(CHIP_X, 34, 'ONE LOG ENTRY', { fill: inkSoft, size: 13, weight: '700', family: 'var(--font-mono)' });
      text(CHIP_X, 54, 'click a field to make it a stream field', { fill: inkSoft, size: 13 });

      FIELDS.forEach((f, i) => {
        const y = CHIP_Y0 + i * CHIP_GAP;
        const on = sel[i];
        const g = rc.rectangle(CHIP_X, y, CHIP_W, CHIP_H, {
          stroke: on ? accent2 : line,
          strokeWidth: on ? 2 : 1.4,
          roughness: 1.3,
          bowing: 1,
          fill: on ? accent2 : panel,
          fillStyle: on ? 'hachure' : 'solid',
          fillWeight: 1.3,
          hachureGap: 5,
        });
        svg.appendChild(g);

        text(CHIP_X + 14, y + 27, `${f.name}=${f.value}`, {
          fill: ink, size: 15, weight: '700', family: 'var(--font-mono)',
        });
        text(CHIP_X + CHIP_W - 12, y + 26, on ? 'stream field' : 'ignored', {
          fill: on ? accent2 : inkSoft, size: 12, anchor: 'end', weight: '700',
        });

        // transparent hit target (rough strokes have gaps) — clickable + keyboardable
        const hit = document.createElementNS(NS, 'rect');
        hit.setAttribute('x', String(CHIP_X));
        hit.setAttribute('y', String(y));
        hit.setAttribute('width', String(CHIP_W));
        hit.setAttribute('height', String(CHIP_H));
        hit.setAttribute('fill', 'transparent');
        hit.style.cursor = 'pointer';
        hit.setAttribute('tabindex', '0');
        hit.setAttribute('role', 'checkbox');
        hit.setAttribute('aria-checked', on ? 'true' : 'false');
        hit.setAttribute('aria-label', `${f.name}=${f.value}, ${on ? 'a stream field' : 'not a stream field'}`);
        const toggle = () => setSel((prev) => prev.map((v, j) => (j === i ? !v : v)));
        hit.addEventListener('click', toggle);
        hit.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
        svg.appendChild(hit);
      });

      // ---- arrow across the gap ----
      const midY = CHIP_Y0 + 1.5 * CHIP_GAP;
      const arr = rc.line(CHIP_X + CHIP_W + 6, midY, OUT_X - 10, midY, { stroke: inkSoft, strokeWidth: 1.6, roughness: 1.5 });
      svg.appendChild(arr);
      text((CHIP_X + CHIP_W + OUT_X) / 2, midY - 10, 'sort', { fill: inkSoft, size: 12, anchor: 'middle' });
      text((CHIP_X + CHIP_W + OUT_X) / 2, midY + 22, '+ hash', { fill: inkSoft, size: 12, anchor: 'middle' });

      // ---- right: derived _stream ----
      const sb = rc.rectangle(OUT_X, 72, OUT_W, 74, {
        stroke: accent, strokeWidth: 2, roughness: 1.3, fill: panel, fillStyle: 'solid',
      });
      svg.appendChild(sb);
      fadeIn(sb);
      text(OUT_X + 14, 94, '_stream', { fill: accent, size: 13, weight: '700', family: 'var(--font-mono)' });
      const shown = streamStr.length > 30 ? streamStr.slice(0, 29) + '…' : streamStr;
      text(OUT_X + 14, 122, shown, { fill: ink, size: 14, weight: '700', family: 'var(--font-mono)' });

      // ---- right: derived _stream_id ----
      const ib = rc.rectangle(OUT_X, 166, OUT_W, 86, {
        stroke: accent, strokeWidth: 2, roughness: 1.3, fill: panel, fillStyle: 'solid',
      });
      svg.appendChild(ib);
      fadeIn(ib);
      text(OUT_X + 14, 188, '_stream_id', { fill: accent, size: 13, weight: '700', family: 'var(--font-mono)' });
      text(OUT_X + 14, 214, '0000000000000000', { fill: inkSoft, size: 14, weight: '700', family: 'var(--font-mono)' });
      text(OUT_X + 14, 236, hash + '…', { fill: accent2, size: 15, weight: '700', family: 'var(--font-mono)' });
      text(OUT_X + OUT_W - 12, 214, 'tenant', { fill: inkSoft, size: 11, anchor: 'end' });
      text(OUT_X + OUT_W - 12, 236, 'hash(tags)', { fill: inkSoft, size: 11, anchor: 'end' });

      // ---- warning ----
      if (explosion) {
        const wb = rc.rectangle(OUT_X, 272, OUT_W, 58, {
          stroke: rollback, strokeWidth: 2, roughness: 1.4, fill: rollback, fillStyle: 'hachure', fillWeight: 1, hachureGap: 6,
        });
        svg.appendChild(wb);
        fadeIn(wb);
        text(OUT_X + 14, 294, '⚠ stream explosion', { fill: rollback, size: 14, weight: '700' });
        text(OUT_X + 14, 314, 'high-cardinality field →', { fill: ink, size: 12 });
        text(OUT_X + 14, 328, 'a new stream per log line', { fill: ink, size: 12 });
      } else {
        text(OUT_X + 14, 300, chosen.length ? '✓ stable stream identity' : 'no stream fields → {}', {
          fill: chosen.length ? accent2 : inkSoft, size: 13, weight: '700',
        });
      }
    }

    build();
    const onTheme = () => build();
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener('change', onTheme);
    return () => mq?.removeEventListener('change', onTheme);
  }, [sel, streamStr, hash, explosion, chosen.length]);

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`A log entry whose stream fields are ${chosen.map((f) => f.name).join(', ') || 'none'}. Derived _stream is ${streamStr}.`}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <button className="sketch-btn" onClick={() => setSel(DEFAULT)}>↺ reset to app, pod</button>
      </div>
    </div>
  );
}
