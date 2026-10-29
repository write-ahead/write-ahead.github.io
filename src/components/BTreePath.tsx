import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

/**
 * A B+tree lookup, animated. Each run picks a target key and lights up the
 * path the engine walks: root → the right leaf → the matching cell (or a
 * miss, in red). Cycles through a few keys, including one that isn't there.
 *
 * Drop <BTreePath client:visible /> into any chapter.
 */

const NS = 'http://www.w3.org/2000/svg';

const TARGETS = [42, 29, 60, 77]; // 77 is absent on purpose
const SEPS = [17, 42, 71];
const LEAVES = [
  [5, 11],
  [17, 29, 38],
  [42, 60],
  [71, 88, 94],
];

// geometry (viewBox 0 0 600 330)
const RX = 185, RY = 24, RW = 230, RH = 48;
const LW = 128, LH = 60, LY = 236, L0 = 16, LGAP = 18.7;

const childFor = (t: number) => (t < 17 ? 0 : t < 42 ? 1 : t < 71 ? 2 : 3);
const leafX = (i: number) => L0 + i * (LW + LGAP);

export default function BTreePath() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timers = useRef<number[]>([]);
  const [ti, setTi] = useState(0);
  const [step, setStep] = useState(0);

  const target = TARGETS[ti];

  // drive the animation whenever the target changes
  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
    if (reduce) {
      setStep(3);
      return;
    }
    setStep(0);
    timers.current.push(window.setTimeout(() => setStep(1), 350));
    timers.current.push(window.setTimeout(() => setStep(2), 1150));
    timers.current.push(window.setTimeout(() => setStep(3), 1950));
    return () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    };
  }, [ti]);

  // (re)draw on every step or theme change
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
      const rollback = cssVar('--rollback');
      const panel = cssVar('--panel');
      const line = cssVar('--line');

      const child = childFor(target);
      const keyIdx = LEAVES[child].indexOf(target);
      const found = keyIdx >= 0;

      // edges root → leaves
      for (let i = 0; i < 4; i++) {
        const px = RX + (RW * (i + 0.5)) / 4;
        const lx = leafX(i) + LW / 2;
        const active = step >= 2 && i === child;
        const e = rc.line(px, RY + RH, lx, LY, {
          stroke: active ? accent : inkSoft,
          strokeWidth: active ? 2.6 : 1,
          roughness: 1.5,
        });
        e.style.opacity = active ? '1' : '0.28';
        svg.appendChild(e);
      }

      // root node
      svg.appendChild(
        rc.rectangle(RX, RY, RW, RH, {
          stroke: step >= 1 ? accent : ink,
          strokeWidth: step >= 1 ? 3 : 2,
          roughness: 1.3, bowing: 1, fill: panel, fillStyle: 'solid',
        })
      );
      for (let j = 1; j < 3; j++) {
        svg.appendChild(
          rc.line(RX + (RW * j) / 3, RY + 6, RX + (RW * j) / 3, RY + RH - 6, {
            stroke: inkSoft, strokeWidth: 1.2, roughness: 1.4,
          })
        );
      }
      SEPS.forEach((k, j) => {
        text(RX + (RW * (j + 0.5)) / 3, RY + RH / 2 + 6, `<${k}`, {
          fill: ink, size: 15, anchor: 'middle', weight: '600',
        });
      });
      text(RX + RW / 2, RY - 10, 'root · internal node', {
        fill: inkSoft, size: 13, anchor: 'middle',
      });

      // leaves
      for (let i = 0; i < 4; i++) {
        const lx = leafX(i);
        const active = step >= 2 && i === child;
        svg.appendChild(
          rc.rectangle(lx, LY, LW, LH, {
            stroke: active ? accent : inkSoft,
            strokeWidth: active ? 2.8 : 1.6,
            roughness: 1.3, bowing: 1, fill: panel, fillStyle: 'solid',
          })
        );
        const keys = LEAVES[i];
        keys.forEach((k, j) => {
          const kx = lx + 20 + j * 34;
          const hit = step >= 3 && i === child && j === keyIdx;
          if (hit) {
            const ring = rc.circle(kx, LY + LH / 2 - 2, 30, {
              stroke: found ? accent2 : rollback,
              strokeWidth: 2.6, roughness: 1.4,
            });
            svg.appendChild(ring);
          }
          text(kx, LY + LH / 2 + 3, String(k), {
            fill: ink, size: 14, anchor: 'middle',
            weight: hit ? '700' : '600', family: 'var(--font-mono)',
          });
        });
        text(lx + 6, LY + LH + 16, `leaf ${i}`, { fill: inkSoft, size: 12 });
      }

      // status line
      if (step >= 3) {
        const child2 = childFor(target);
        const found2 = LEAVES[child2].includes(target);
        text(
          300, 20,
          found2 ? `found ${target} in leaf ${child2}  ✓` : `${target} is not in the tree  ✗`,
          { fill: found2 ? accent2 : rollback, size: 16, anchor: 'middle', weight: '700' }
        );
      } else {
        text(300, 20, `looking up  ${target}`, {
          fill: accent, size: 16, anchor: 'middle', weight: '700',
        });
      }
    }

    build();
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onTheme = () => build();
    mq?.addEventListener('change', onTheme);
    return () => mq?.removeEventListener('change', onTheme);
  }, [ti, step, target]);

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 600 330"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`A B+tree. A search for ${target} walks from the root node down to the correct leaf and highlights the matching key.`}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <button className="sketch-btn" onClick={() => setTi((n) => (n + 1) % TARGETS.length)}>
          ▶ search for another key
        </button>
      </div>
    </div>
  );
}
