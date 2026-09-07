import { FLOW } from '@/data/vocab';
import type { ForecastResult } from '@/lib/forecast';
import { fmt } from '@/lib/format';

const W = 1200;
const H = 280;
const PAD = { left: 44, right: 44, top: 16, bottom: 28 };
// Colour tokens per series (fill utilities from the theme; no literals in components – DESIGN-DARK.md § 1).
const SERIES_FILL = { arrivals: 'fill-track', admissions: 'fill-primary', discharges: 'fill-green', elective: 'fill-purple' } as const;
const SERIES_SWATCH = { arrivals: 'bg-track', admissions: 'bg-primary', discharges: 'bg-green', elective: 'bg-purple' } as const;
const AXIS_TEXT = 'fill-text-secondary';

/**
 * 24 hourly buckets: grouped bars for arrivals, admissions, discharges and elective admissions (left axis)
 * and the resulting free-beds line (right axis) with a zero line; negative free beds in red.
 */
export function ForecastChart({ result, clock }: { result: ForecastResult; clock: number }) {
  const { buckets } = result;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / buckets.length;
  const barMax = Math.max(1, ...buckets.flatMap((b) => [b.arrivals, b.admissions, b.discharges, b.elective]));
  const frees = buckets.map((b) => b.free);
  const freeMax = Math.max(5, ...frees);
  const freeMin = Math.min(0, ...frees);
  const yBar = (v: number) => PAD.top + innerH - (v / barMax) * innerH;
  const yFree = (v: number) => PAD.top + ((freeMax - v) / (freeMax - freeMin)) * innerH;
  const barW = slot / 5;
  const series: Array<{ key: keyof typeof SERIES_FILL; label: string; get: (b: ForecastResult['buckets'][number]) => number }> = [
    { key: 'arrivals', label: FLOW.forecast.legend.arrivals, get: (b) => b.arrivals },
    { key: 'admissions', label: FLOW.forecast.legend.admissions, get: (b) => b.admissions },
    { key: 'discharges', label: FLOW.forecast.legend.discharges, get: (b) => b.discharges },
    { key: 'elective', label: FLOW.forecast.legend.elective, get: (b) => b.elective },
  ];
  const linePoints = buckets.map((b, i) => `${PAD.left + i * slot + slot / 2},${yFree(b.free)}`).join(' ');
  const nowIndex = buckets.findIndex((b) => clock >= b.start && clock < b.end);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-small text-text-secondary">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className={`inline-block size-3 rounded-sm ${SERIES_SWATCH[s.key]} ${s.key === 'arrivals' ? 'border border-border-input' : ''}`} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-text" />
          {FLOW.forecast.legend.free}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={FLOW.forecast.title}>
        <line x1={PAD.left} x2={W - PAD.right} y1={yFree(0)} y2={yFree(0)} className="stroke-text-muted" strokeWidth={1} strokeDasharray="4 4" />
        {buckets.map((b, i) => (
          <g key={b.start}>
            {series.map((s, j) => {
              const v = s.get(b);
              const x = PAD.left + i * slot + barW / 2 + j * barW;
              return (
                <rect
                  key={s.key}
                  x={x}
                  y={yBar(v)}
                  width={barW - 1}
                  height={Math.max(0, PAD.top + innerH - yBar(v))}
                  className={`${SERIES_FILL[s.key]} ${s.key === 'arrivals' ? 'stroke-border-input' : ''}`}
                />
              );
            })}
            {i % 2 === 0 ? (
              <text x={PAD.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={12} className={AXIS_TEXT}>
                {b.label}
              </text>
            ) : null}
          </g>
        ))}
        {nowIndex >= 0 ? (
          <g>
            <line x1={PAD.left + nowIndex * slot + slot / 2} x2={PAD.left + nowIndex * slot + slot / 2} y1={PAD.top} y2={PAD.top + innerH} className="stroke-primary" strokeWidth={1} strokeDasharray="2 3" />
            <text x={PAD.left + nowIndex * slot + slot / 2 + 4} y={PAD.top + 12} fontSize={12} className="fill-primary-text">
              {FLOW.forecast.now}
            </text>
          </g>
        ) : null}
        <polyline points={linePoints} fill="none" className="stroke-text" strokeWidth={2} />
        {buckets.map((b, i) => (
          <circle key={b.start} cx={PAD.left + i * slot + slot / 2} cy={yFree(b.free)} r={3} className={b.free < 0 ? 'fill-red' : 'fill-text'} />
        ))}
        <text x={W - PAD.right + 6} y={yFree(freeMax) + 4} fontSize={12} className={AXIS_TEXT}>
          {fmt(Math.round(freeMax))}
        </text>
        <text x={W - PAD.right + 6} y={yFree(0) + 4} fontSize={12} className={AXIS_TEXT}>
          0
        </text>
        {freeMin < 0 ? (
          <text x={W - PAD.right + 6} y={yFree(freeMin) + 4} fontSize={12} className="fill-red">
            {fmt(Math.round(freeMin))}
          </text>
        ) : null}
        <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize={12} className={AXIS_TEXT}>
          {fmt(Math.round(barMax))}
        </text>
        <text x={PAD.left - 6} y={PAD.top + innerH + 4} textAnchor="end" fontSize={12} className={AXIS_TEXT}>
          0
        </text>
      </svg>
    </div>
  );
}
