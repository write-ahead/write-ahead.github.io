import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

/**
 * Write-Ahead's signature diagram: a slotted database page.
 * Click to insert a row — the slot directory grows left-to-right from the
 * top, the tuples grow bottom-to-top, and the free space in the middle
 * shrinks. When the page fills up, it compacts and starts over.
 *
 * Drop <SlottedPage client:visible /> into any chapter.
 */

const NS = 'http://www.w3.org/2000/svg';
const MAX = 7;

// page geometry (viewBox 0 0 600 400)
const PX = 30, PY = 16, PW = 540, PH = 368;
const HEAD_H = 34;
const SLOT_W = 34, SLOT_H = 24, SLOT_X0 = 48, SLOT_Y = 78, SLOT_GAP = 40;
const TUP_X = 60, TUP_W = 476, TUP_H = 32, TUP_GAP = 38, TUP_BASE = 372;

// a believable 8 KiB page
const PAGE_BYTES = 8192;
const ROW_BYTES = 1108; // ~1 tuple + its 4-byte slot pointer

export default function SlottedPage() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const prevRows = useRef(3);
  const [rows, setRows] = useState(3);

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
      opts: { fill: string; size?: number; anchor?: string; weight?: string; family?: string }
    ) {
      if (!svg) return;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(x));
      t.setAttribute('y', String(y));
      t.setAttribute('fill', opts.fill);
      t.setAttribute('font-family', opts.family ?? 'var(--font-hand)');
      t.setAttribute('font-size', String(opts.size ?? 15));
      t.setAttribute('text-anchor', opts.anchor ?? 'start');
      t.setAttribute('font-weight', opts.weight ?? '600');
      t.textContent = s;
      svg.appendChild(t);
    }

    function fadeIn(el: SVGElement) {
      if (reduce) return;
      el.style.opacity = '0';
      el.style.transition = 'opacity .45s ease';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.style.opacity = '1';
        })
      );
    }

    function build(animateNew: boolean) {
      if (!svg) return;
      svg.innerHTML = '';
      const rc = rough.svg(svg);
      const ink = cssVar('--ink');
      const inkSoft = cssVar('--ink-soft');
      const accent = cssVar('--accent');
      const accent2 = cssVar('--accent2');
      const panel = cssVar('--panel');
      const line = cssVar('--line');

      // the page
      svg.appendChild(
        rc.rectangle(PX, PY, PW, PH, {
          stroke: ink, strokeWidth: 2.4, roughness: 1.5, bowing: 1.1,
          fill: panel, fillStyle: 'solid',
        })
      );

      // header strip
      svg.appendChild(
        rc.rectangle(PX + 10, PY + 10, PW - 20, HEAD_H, {
          stroke: accent, strokeWidth: 1.6, roughness: 1.3, fill: accent, fillStyle: 'solid',
        })
      );

      // free-space band (only while there's room to show)
      const topTupleTop = TUP_BASE - rows * TUP_GAP;
      const bandTop = SLOT_Y + SLOT_H + 10;
      const bandH = topTupleTop - bandTop - 8;
      if (bandH > 14) {
        svg.appendChild(
          rc.rectangle(TUP_X, bandTop, TUP_W, bandH, {
            stroke: line, strokeWidth: 1.1, roughness: 1.9,
            fill: inkSoft, fillStyle: 'hachure', fillWeight: 0.8, hachureGap: 10, hachureAngle: -40,
          })
        );
      }

      // tuples (grow upward from the bottom)
      for (let i = 0; i < rows; i++) {
        const ty = TUP_BASE - (i + 1) * TUP_GAP;
        const g = rc.rectangle(TUP_X, ty, TUP_W, TUP_H, {
          stroke: accent2, strokeWidth: 1.8, roughness: 1.3, bowing: 1,
          fill: accent2, fillStyle: 'hachure', fillWeight: 1.3, hachureGap: 5,
        });
        svg.appendChild(g);
        if (animateNew && i === rows - 1) fadeIn(g);
      }

      // slot directory (grows left→right along the top) + pointer lines
      for (let i = 0; i < rows; i++) {
        const sx = SLOT_X0 + i * SLOT_GAP;
        const ty = TUP_BASE - (i + 1) * TUP_GAP;
        const newest = i === rows - 1;
        // pointer: slot i -> its tuple's right edge
        const pl = rc.line(sx + SLOT_W / 2, SLOT_Y + SLOT_H, TUP_X + TUP_W, ty + TUP_H / 2, {
          stroke: newest ? accent : inkSoft,
          strokeWidth: newest ? 1.8 : 1,
          roughness: 1.6,
        });
        pl.style.opacity = newest ? '0.9' : '0.28';
        svg.appendChild(pl);
        if (animateNew && newest) fadeIn(pl);

        const g = rc.rectangle(sx, SLOT_Y, SLOT_W, SLOT_H, {
          stroke: ink, strokeWidth: 1.6, roughness: 1.2, fill: accent, fillStyle: 'solid',
        });
        svg.appendChild(g);
        if (animateNew && newest) fadeIn(g);
      }

      // ---- labels (drawn last so they sit on top) ----
      text(SLOT_X0, SLOT_Y - 10, 'slot directory →', { fill: inkSoft, size: 14 });
      for (let i = 0; i < rows; i++) {
        const sx = SLOT_X0 + i * SLOT_GAP;
        text(sx + SLOT_W / 2, SLOT_Y + 16, String(i), {
          fill: panel, size: 14, anchor: 'middle', weight: '700',
        });
        const ty = TUP_BASE - (i + 1) * TUP_GAP;
        text(TUP_X + 12, ty + 21, `row ${i}`, { fill: ink, size: 14, weight: '600' });
      }
      if (bandH > 24) {
        text(TUP_X + TUP_W / 2, bandTop + bandH / 2 + 5, 'free space', {
          fill: inkSoft, size: 15, anchor: 'middle',
        });
      }

      // header readout
      const free = Math.max(0, PAGE_BYTES - 20 - rows * ROW_BYTES);
      text(PX + 24, PY + 32, 'PAGE 0 · HEADER', {
        fill: panel, size: 14, weight: '700', family: 'var(--font-mono)',
      });
      text(PX + PW - 24, PY + 32, `free: ${free} B`, {
        fill: panel, size: 14, anchor: 'end', weight: '600', family: 'var(--font-mono)',
      });
    }

    const grew = rows > prevRows.current;
    build(grew);
    prevRows.current = rows;

    const onTheme = () => build(false);
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener('change', onTheme);
    return () => mq?.removeEventListener('change', onTheme);
  }, [rows]);

  const full = rows >= MAX;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`A database page holding ${rows} rows. A slot directory grows from the top-left, the rows grow up from the bottom, and the free space between them shrinks as rows are added.`}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <button className="sketch-btn" onClick={() => setRows((r) => (r >= MAX ? 3 : r + 1))}>
          {full ? '↺ page full — compact & reset' : '▶ insert a row'}
        </button>
      </div>
    </div>
  );
}
