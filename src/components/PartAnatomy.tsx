import { useEffect, useRef } from 'react';
import rough from 'roughjs';

/**
 * Static, hand-drawn anatomy of a datadb *part* — the files inside one
 * immutable part directory, grouped by the job they do. The _msg column's
 * dedicated files are highlighted. Byte-level contents are left to later
 * chapters; this is the file-level map.
 *
 * <PartAnatomy client:visible />
 */

const NS = 'http://www.w3.org/2000/svg';

export default function PartAnatomy() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const cssVar = (n: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#333';

    function text(
      x: number, y: number, s: string,
      o: { fill: string; size?: number; anchor?: string; weight?: string; family?: string }
    ) {
      if (!svg) return;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(x));
      t.setAttribute('y', String(y));
      t.setAttribute('fill', o.fill);
      t.setAttribute('font-family', o.family ?? 'var(--font-hand)');
      t.setAttribute('font-size', String(o.size ?? 14));
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
      const rollback = cssVar('--rollback');
      const panel = cssVar('--panel');

      const X = 16, W = 568;
      const mono = 'var(--font-mono)';

      // group helper
      function group(y: number, h: number, stroke: string) {
        svg!.appendChild(
          rc.rectangle(X, y, W, h, { stroke, strokeWidth: 2, roughness: 1.3, bowing: 1, fill: panel, fillStyle: 'solid' })
        );
      }

      text(X, 22, 'ONE PART  (an immutable directory inside datadb/)', {
        fill: inkSoft, size: 13, weight: '700', family: mono,
      });

      // 1 — summary
      group(34, 42, accent);
      text(X + 14, 52, 'metadata.json', { fill: accent, size: 14, weight: '700', family: mono });
      text(X + 14, 70, 'the part summary — 5 rows · 3 blocks · format v3 · time range', { fill: ink, size: 13 });

      // 2 — block index
      group(86, 54, accent);
      text(X + 14, 104, 'metaindex.bin  →  index.bin', { fill: accent, size: 14, weight: '700', family: mono });
      text(X + 14, 124, 'the block index: jump to the right block(s) without a scan', { fill: ink, size: 13 });

      // 3 — column metadata
      group(150, 72, accent);
      text(X + 14, 170, 'column_names.bin   columns_header.bin', { fill: accent, size: 13, weight: '700', family: mono });
      text(X + 14, 188, 'columns_header_index.bin   column_idxs.bin', { fill: accent, size: 13, weight: '700', family: mono });
      text(X + 14, 210, 'which fields exist, their types, and where each column lives', { fill: ink, size: 13 });

      // 4 — column data (teal)
      group(232, 150, accent2);
      text(X + 14, 252, 'THE ACTUAL DATA, STORED BY COLUMN', { fill: accent2, size: 12, weight: '700', family: mono });
      text(X + 14, 274, 'timestamps.bin', { fill: ink, size: 13, weight: '700', family: mono });
      text(X + 190, 274, '— the _time of every row', { fill: inkSoft, size: 12 });
      text(X + 14, 296, 'values.bin0  +  bloom.bin0', { fill: ink, size: 13, weight: '700', family: mono });
      text(X + 230, 296, '— ordinary columns (+ bloom)', { fill: inkSoft, size: 12 });

      // highlighted: the _msg special files
      svg.appendChild(
        rc.rectangle(X + 10, 310, W - 20, 60, {
          stroke: rollback, strokeWidth: 2, roughness: 1.3,
          fill: rollback, fillStyle: 'hachure', fillWeight: 1, hachureGap: 7,
        })
      );
      text(X + 24, 332, 'message_values.bin  +  message_bloom.bin', { fill: rollback, size: 13, weight: '700', family: mono });
      text(X + 24, 352, '_msg gets its OWN files — it is the empty-name ("") column', { fill: ink, size: 12 });
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
      viewBox="0 0 600 384"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label="The files inside one datadb part, grouped by role: metadata.json (summary); metaindex.bin and index.bin (the block index); column_names/columns_header/columns_header_index/column_idxs (column metadata); and the column data itself — timestamps.bin, values.bin0 plus bloom.bin0 for ordinary columns, and message_values.bin plus message_bloom.bin for the _msg column, which is stored in its own files."
    />
  );
}
