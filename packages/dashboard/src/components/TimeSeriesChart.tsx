import { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Tracks the rendered width so the SVG viewBox can be 1 unit = 1 px. Without
 * this the viewBox keeps its own aspect ratio and the plot renders at natural
 * size centred in a wider box, leaving dead space on both sides.
 */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/** Rounds an axis maximum up to a readable step (1/2/5 × 10ⁿ). */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Categorical series colors — slots 1 and 2 of the validated dark-mode
 * categorical order (blue, orange). Assigned in fixed order, never cycled.
 * Deliberately NOT the app's status green/amber/red, which stay reserved for
 * node state so a series can never impersonate a status.
 * Validated on this surface: CVD ΔE 26.8, normal-vision ΔE 31.8, both ≥3:1.
 */
export const SERIES_COLORS = ['#3987e5', '#d95926'] as const;

export interface Series {
  label: string;
  points: { t: number; v: number }[];
}

interface TimeSeriesChartProps {
  series: Series[];
  /** Formats a value for the axis, tooltip and direct label. */
  format: (value: number) => string;
  /** Force the y-axis top (e.g. 100 for a percentage). Otherwise data max. */
  yMax?: number;
  height?: number;
}

const PAD = { top: 8, right: 8, bottom: 18, left: 46 };

export function TimeSeriesChart({ series, format, yMax, height = 140 }: TimeSeriesChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const { xs, max, plot } = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    const times = [...new Set(all.map((p) => p.t))].sort((a, b) => a - b);
    const dataMax = all.length ? Math.max(...all.map((p) => p.v)) : 0;
    const computedMax = yMax ?? niceMax(Math.max(dataMax * 1.1, 1));
    return {
      xs: times,
      max: computedMax,
      plot: { w: Math.max(width - PAD.left - PAD.right, 1), h: height - PAD.top - PAD.bottom },
    };
  }, [series, yMax, height, width]);

  if (xs.length === 0) {
    return (
      <div ref={ref}>
        <p className="text-xs text-faint py-6 text-center">No samples in this window.</p>
      </div>
    );
  }

  const x = (t: number) =>
    PAD.left + (xs.length === 1 ? plot.w / 2 : ((t - xs[0]) / (xs[xs.length - 1] - xs[0] || 1)) * plot.w);
  const y = (v: number) => PAD.top + plot.h - (Math.min(v, max) / max) * plot.h;

  const gridLines = [0, 0.5, 1].map((f) => ({ f, v: max * (1 - f) }));
  const hoverT = hoverIndex !== null ? xs[hoverIndex] : null;

  return (
    <div className="relative" ref={ref}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="none"
        role="img"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * width;
          let nearest = 0;
          let best = Infinity;
          xs.forEach((t, i) => {
            const d = Math.abs(x(t) - px);
            if (d < best) {
              best = d;
              nearest = i;
            }
          });
          setHoverIndex(nearest);
        }}
      >
        <defs>
          {series.map((_, i) => (
            <linearGradient key={i} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLORS[i]} stopOpacity="0.22" />
              <stop offset="100%" stopColor={SERIES_COLORS[i]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Recessive grid + axis labels */}
        {gridLines.map(({ f, v }) => {
          const gy = PAD.top + plot.h * f;
          return (
            <g key={f}>
              <line x1={PAD.left} y1={gy} x2={width - PAD.right} y2={gy} stroke="#25322c" strokeWidth="1" />
              <text x={PAD.left - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#697871">
                {format(v)}
              </text>
            </g>
          );
        })}

        {series.map((s, i) => {
          const pts = [...s.points].sort((a, b) => a.t - b.t);
          if (pts.length === 0) return null;
          const line = pts.map((p) => `${x(p.t)},${y(p.v)}`).join(' ');
          const area = `${PAD.left},${PAD.top + plot.h} ${line} ${x(pts[pts.length - 1].t)},${PAD.top + plot.h}`;
          return (
            <g key={s.label}>
              <polygon points={area} fill={`url(#${gradientId}-${i})`} />
              <polyline
                points={line}
                fill="none"
                stroke={SERIES_COLORS[i]}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Crosshair + markers on hover */}
        {hoverT !== null && (
          <g>
            <line
              x1={x(hoverT)}
              y1={PAD.top}
              x2={x(hoverT)}
              y2={PAD.top + plot.h}
              stroke="#697871"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {series.map((s, i) => {
              const point = s.points.find((p) => p.t === hoverT);
              if (!point) return null;
              return (
                <circle
                  key={s.label}
                  cx={x(point.t)}
                  cy={y(point.v)}
                  r="4"
                  fill={SERIES_COLORS[i]}
                  stroke="#141d19"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}
      </svg>

      {hoverT !== null && (
        <div className="absolute top-0 right-0 bg-bg border border-borderStrong rounded-md px-2.5 py-1.5 text-2xs pointer-events-none shadow-lg">
          <div className="text-faint mb-1">{new Date(hoverT).toLocaleTimeString()}</div>
          {series.map((s, i) => {
            const point = s.points.find((p) => p.t === hoverT);
            return (
              <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ background: SERIES_COLORS[i] }}
                />
                <span className="text-muted">{s.label}</span>
                <span className="text-ink ml-auto tabular-nums">
                  {point ? format(point.v) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Legend for multi-series charts — identity is never carried by color alone. */
export function ChartLegend({ labels }: { labels: string[] }) {
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-2xs text-muted">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SERIES_COLORS[i] }} />
          {label}
        </span>
      ))}
    </div>
  );
}
