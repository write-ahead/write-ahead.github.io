import { useEffect, useRef } from 'react';
import rough from 'roughjs';

/**
 * A static, hand-drawn containment map for a log store:
 * Storage → per-day partitions → the TWO independent LSM trees each partition
 * keeps (datadb for log data, indexdb for the stream index).
 *
 * Non-interactive. Drop <ContainmentTree client:visible /> into a chapter.
 */

const NS = 'http://www.w3.org/2000/svg';

export default function ContainmentTree() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
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

    function build() {
      if (!svg) return;
      svg.innerHTML = '';
      const rc = rough.svg(svg);
      const ink = cssVar('--ink');
      const inkSoft = cssVar('--ink-soft');
      const accent = cssVar('--accent');
      const accent2 = cssVar('--accent2');
      const panel = cssVar('--panel');
      const line = cssVar('--line');

      // Storage — the whole store
      svg.appendChild(
        rc.rectangle(12, 36, 576, 322, {
          stroke: ink, strokeWidth: 2.4, roughness: 1.4, bowing: 1, fill: panel, fillStyle: 'solid',
        })
      );
      text(28, 28, 'STORAGE', { fill: inkSoft, size: 13, weight: '700', family: 'var(--font-mono)' });

      // faint "other days" behind the live partition
      svg.appendChild(rc.rectangle(50, 78, 520, 258, { stroke: line, strokeWidth: 1.2, roughness: 1.6 }));
      svg.appendChild(rc.rectangle(42, 70, 520, 258, { stroke: line, strokeWidth: 1.2, roughness: 1.6 }));

      // the live per-day partition
      svg.appendChild(
        rc.rectangle(34, 62, 520, 262, {
          stroke: ink, strokeWidth: 2, roughness: 1.3, fill: panel, fillStyle: 'solid',
        })
      );
      text(50, 88, 'partition', { fill: ink, size: 16, weight: '700' });
      text(136, 88, '· one per day (20261030)', { fill: inkSoft, size: 13 });

      // the two LSM trees
      text(50, 116, 'two independent LSM trees:', { fill: inkSoft, size: 12 });

      // datadb (teal — the data)
      svg.appendChild(
        rc.rectangle(50, 128, 244, 176, {
          stroke: accent2, strokeWidth: 2, roughness: 1.3, fill: accent2, fillStyle: 'hachure', fillWeight: 1, hachureGap: 7,
        })
      );
      text(66, 156, 'datadb', { fill: accent2, size: 18, weight: '700', family: 'var(--font-mono)' });
      text(66, 180, 'the log data', { fill: ink, size: 14 });
      text(66, 200, '(a columnar LSM)', { fill: inkSoft, size: 12 });
      text(66, 236, 'part', { fill: ink, size: 13, weight: '700' });
      text(66, 256, '  └ block  (one stream)', { fill: inkSoft, size: 12, family: 'var(--font-mono)' });
      text(66, 274, '      └ column  (one field)', { fill: inkSoft, size: 12, family: 'var(--font-mono)' });

      // indexdb (accent — the index)
      svg.appendChild(
        rc.rectangle(310, 128, 228, 176, {
          stroke: accent, strokeWidth: 2, roughness: 1.3, fill: accent, fillStyle: 'hachure', fillWeight: 1, hachureGap: 7,
        })
      );
      text(326, 156, 'indexdb', { fill: accent, size: 18, weight: '700', family: 'var(--font-mono)' });
      text(326, 180, 'the stream index', { fill: ink, size: 14 });
      text(326, 200, '(a mergeset LSM)', { fill: inkSoft, size: 12 });
      text(326, 240, 'tag:name=value', { fill: ink, size: 13, weight: '700', family: 'var(--font-mono)' });
      text(326, 260, '      → streamIDs', { fill: inkSoft, size: 13, family: 'var(--font-mono)' });
    }

    build();
    const onTheme = () => build();
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener('change', onTheme);
    return () => mq?.removeEventListener('change', onTheme);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 372"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label="A Storage holds many per-day partitions. Each partition keeps two independent LSM trees: datadb for the log data (part, block, column), and indexdb for the stream index (tag name=value maps to stream IDs)."
    />
  );
}
