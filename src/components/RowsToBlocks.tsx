import { useEffect, useRef } from 'react';
import rough from 'roughjs';

/**
 * Static, hand-drawn view of why 5 rows became 3 blocks: rows are sorted by
 * (stream, time) and a block never mixes two streams — so one block per stream
 * here. Each block then stores its fields column by column. Conceptual only;
 * the byte layout is a later chapter.
 *
 * <RowsToBlocks client:visible />
 */

const NS = 'http://www.w3.org/2000/svg';

// 5 rows, colored by stream
const ROWS = [
  { s: 0, t: '10:00:01', m: 'user logged in' },
  { s: 0, t: '10:00:02', m: 'db timeout after 3s' },
  { s: 0, t: '10:00:03', m: 'field order ignored' },
  { s: 1, t: '10:00:04', m: 'different pod' },
  { s: 2, t: '10:00:05', m: 'different app' },
];
const STREAM_LABEL = ['{app=api, pod=api-7}', '{app=api, pod=api-9}', '{app=worker, pod=w-2}'];

export default function RowsToBlocks() {
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
      t.setAttribute('font-size', String(o.size ?? 13));
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
      const mono = 'var(--font-mono)';
      const streamColor = [accent2, accent, rollback];

      // left: 5 ingested rows
      text(16, 22, '5 ROWS, SORTED BY (STREAM, TIME)', { fill: inkSoft, size: 12, weight: '700', family: mono });
      const RX = 16, RW = 250, RH = 34, RG = 40, RY = 36;
      ROWS.forEach((r, i) => {
        const y = RY + i * RG;
        svg!.appendChild(
          rc.rectangle(RX, y, RW, RH, {
            stroke: streamColor[r.s], strokeWidth: 1.8, roughness: 1.2,
            fill: streamColor[r.s], fillStyle: 'hachure', fillWeight: 1.1, hachureGap: 6,
          })
        );
        text(RX + 12, y + 22, `${r.t}  ${r.m}`, { fill: ink, size: 12, family: mono });
      });

      // arrow
      text(300, 120, '→', { fill: inkSoft, size: 30, anchor: 'middle' });
      text(300, 150, 'cut a block', { fill: inkSoft, size: 11, anchor: 'middle' });
      text(300, 166, 'at each', { fill: inkSoft, size: 11, anchor: 'middle' });
      text(300, 182, 'stream change', { fill: inkSoft, size: 11, anchor: 'middle' });

      // right: 3 blocks
      text(348, 22, '3 BLOCKS — ONE PER STREAM', { fill: inkSoft, size: 12, weight: '700', family: mono });
      const BX = 348, BW = 236;
      const blocks = [
        { s: 0, rows: 3, y: 34, h: 96 },
        { s: 1, rows: 1, y: 140, h: 44 },
        { s: 2, rows: 1, y: 194, h: 44 },
      ];
      blocks.forEach((b) => {
        svg!.appendChild(
          rc.rectangle(BX, b.y, BW, b.h, {
            stroke: streamColor[b.s], strokeWidth: 2.2, roughness: 1.2, fill: panel, fillStyle: 'solid',
          })
        );
        text(BX + 12, b.y + 20, `block · ${b.rows} row${b.rows > 1 ? 's' : ''}`, {
          fill: streamColor[b.s], size: 13, weight: '700',
        });
        text(BX + 12, b.y + 38, STREAM_LABEL[b.s], { fill: inkSoft, size: 11, family: mono });
        if (b.rows > 1) text(BX + 12, b.y + 62, 'stored column by column', { fill: ink, size: 11 });
      });
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
      viewBox="0 0 600 250"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label="Five ingested rows, sorted by stream then time, are cut into three blocks — one per stream. The api-7 stream's three rows form one block; the api-9 and worker streams form one block each. A block never mixes two streams."
    />
  );
}
