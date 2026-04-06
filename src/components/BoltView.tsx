import React from 'react';
import type { Bolt as BoltType } from '../lib/types';
import { getPalette } from '../lib/palettes';

type Props = {
  bolt: BoltType;
  paletteId: number;
  selected?: boolean;
  invalid?: boolean;
  showDebug?: boolean;
  onClick?: (id: string) => void;
};

// === Side-view bolt dimensions — tip at TOP, head at BOTTOM ===
const W = 120; // SVG width
const CX = W / 2; // center x = 60
const HEAD_W = 64; // bolt head width (keep original)
const HEAD_H = 32; // bolt head height
const HEAD_X = (W - HEAD_W) / 2; // center head
const SHAFT_W = 28; // shaft (screw) width — increased
const SHAFT_X = CX - SHAFT_W / 2; // shaft x derived from CX
const SLOT_H = 34; // height per nut slot
const NUT_H = 26; // nut hex height
const NUT_W = 72; // nut hex width
const NUT_X = (W - NUT_W) / 2; // centered under wider bolt
const NUT_Y_PAD = (SLOT_H - NUT_H) / 2; // vertical padding in slot = 3
const THREAD_H = 22; // pointed tip + thread section at top
const TOP_PAD = 8; // extra space above the tip so top nut isn't clipped

function clamp(v: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, Math.round(v)));
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function lighten(hex: string, amt = 0.1) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(clamp(r + 255 * amt), clamp(g + 255 * amt), clamp(b + 255 * amt));
}
function darken(hex: string, amt = 0.1) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(clamp(r - 255 * amt), clamp(g - 255 * amt), clamp(b - 255 * amt));
}

// Layout (y increases downward):
//  [0 .. THREAD_H]               = tip point + thread marks
//  [THREAD_H .. THREAD_H+cap*SLOT_H] = nut slots (slot cap-1 near tip, slot 0 near head)
//  [THREAD_H+cap*SLOT_H .. svgH]     = bolt head

/** y-position (top edge) of slot i. slot 0 = bottommost (nearest head). */
function slotTop(slotIdx: number, capacity: number): number {
  return THREAD_H + (capacity - 1 - slotIdx) * SLOT_H;
}

/** y-position (top edge) of the nut rect within slot i. */
function nutTop(slotIdx: number, capacity: number): number {
  return slotTop(slotIdx, capacity) + NUT_Y_PAD;
}

/**
 * Build an SVG path string for a rounded polygon given vertex points.
 * Uses quadratic bezier at each corner with radius `r`.
 */
function roundedPath(points: Array<{ x: number; y: number }>, r = 6) {
  if (!points || points.length === 0) return '';
  const n = points.length;
  // clamp radius to edge lengths
  const pts = points;
  const getPrev = (i: number) => pts[(i - 1 + n) % n];
  const getNext = (i: number) => pts[(i + 1) % n];

  const segPoints: Array<{ x: number; y: number; sx: number; sy: number; ex: number; ey: number }> = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = getPrev(i);
    const next = getNext(i);
    // vector from p to prev and next
    const v1x = prev.x - p.x;
    const v1y = prev.y - p.y;
    const v2x = next.x - p.x;
    const v2y = next.y - p.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    const r1 = Math.min(r, len1 / 2, len2 / 2);
    // normalize and compute start/end points along edges
    const sx = p.x + (v1x / len1) * r1;
    const sy = p.y + (v1y / len1) * r1;
    const ex = p.x + (v2x / len2) * r1;
    const ey = p.y + (v2y / len2) * r1;
    segPoints.push({ x: p.x, y: p.y, sx, sy, ex, ey });
  }

  // build path
  let d = '';
  // move to first start
  d += `M ${segPoints[0].sx} ${segPoints[0].sy}`;
  for (let i = 0; i < n; i++) {
    const cur = segPoints[i];
    const next = segPoints[(i + 1) % n];
    // line to corner start
    d += ` L ${cur.x} ${cur.y}`;
    // quadratic bezier to next ex,ey with control at corner point cur.x,cur.y
    d += ` Q ${cur.x} ${cur.y} ${next.sx} ${next.sy}`;
  }
  d += ' Z';
  return d;
}

export default function BoltView({
  bolt,
  paletteId,
  selected = false,
  invalid = false,
  showDebug = false,
  onClick,
}: Props) {
  const palette = getPalette(paletteId);
  const capacity = bolt.capacity;
  // Safety net: if the bolt state is somehow over-capacity, use the actual
  // nut count so all nuts have a valid slot position and none are clipped.
  const effectiveCapacity = Math.max(capacity, bolt.nuts.length);
  const headY = THREAD_H + effectiveCapacity * SLOT_H; // y where head begins (relative to drawing origin)
  const svgH = headY + HEAD_H + TOP_PAD; // add extra top padding to overall svg height
  // Ensure the bolt is always visible by scaling it down if it would exceed
  // the available display height. Use the viewport height (when available)
  // so tall bolts scale to fit smaller screens rather than being clipped.
  const DEFAULT_MAX = 320; // fallback
  let MAX_DISPLAY_HEIGHT = DEFAULT_MAX;
  if (typeof window !== 'undefined' && typeof window.innerHeight === 'number') {
    // available vertical space (leave room for topbar/controls)
    const avail = window.innerHeight - 160;
    // clamp into a reasonable range; allow smaller viewports to use a smaller max
    if (avail > 0) {
      MAX_DISPLAY_HEIGHT = Math.min(avail, 900);
    } else {
      MAX_DISPLAY_HEIGHT = DEFAULT_MAX;
    }
  }
  const scale = svgH > MAX_DISPLAY_HEIGHT ? MAX_DISPLAY_HEIGHT / svgH : 1;
  const headGradId = `head-${bolt.id}`;
  const shaftGradId = `shaft-${bolt.id}`;
  const dsFilterId = `ds-${bolt.id}`;
  const platformGradId = `plat-${bolt.id}`;

  function readableTextColor(hex: string) {
    // strip # if present
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    // relative luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.6 ? '#000000' : '#ffffff';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Bolt ${bolt.id}, ${bolt.nuts.length} of ${capacity} nuts`}
      className={`bolt ${selected ? 'bolt-selected' : ''} ${invalid ? 'bolt-invalid' : ''}`}
      onClick={() => onClick?.(bolt.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(bolt.id);
        }
      }}
      data-bolt={bolt.id}
      style={{ display: 'inline-block' }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <svg width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`} aria-hidden="true">
          <defs>
            {/* Drop shadow for nuts/head */}
            <filter id={dsFilterId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="var(--amb-shadow-color)" floodOpacity="0.9" />
            </filter>
            {/* Bolt head gradient (top-lit) */}
            <linearGradient id={headGradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--head-grad-light)" />
              <stop offset="100%" stopColor="var(--head-grad-dark)" />
            </linearGradient>
            {/* Shaft gradient (side-lit — lighter in center) */}
            <linearGradient id={shaftGradId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--shaft-dark)" />
              <stop offset="35%" stopColor="var(--shaft-mid)" />
              <stop offset="65%" stopColor="var(--shaft-mid)" />
              <stop offset="100%" stopColor="var(--shaft-dark)" />
            </linearGradient>
            {/* Thread pattern — diagonal stripes */}
            <pattern
              id={`thread-${bolt.id}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(25)"
            >
              <rect width="8" height="8" fill="transparent" />
              <path d="M0 0 L0 2" stroke="var(--thread-stroke)" strokeWidth="1" />
            </pattern>
          </defs>

          <g transform={`translate(0, ${TOP_PAD})`}>
            {/* ambient elliptical shadow under the bolt */}
            <defs>
              <radialGradient id={`amb-${bolt.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--amb-shadow-color)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--amb-shadow-color)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={CX} cy={svgH - 8} rx={HEAD_W * 0.9} ry={12} fill={`url(#amb-${bolt.id})`} />

            {/* ── Shaft (full height from tip down to top of head) ── */}
            <rect x={SHAFT_X} y={0} width={SHAFT_W} height={headY} fill={`url(#${shaftGradId})`} />
            {/* overlay subtle thread lines using the pattern */}
            <rect
              x={SHAFT_X}
              y={0}
              width={SHAFT_W}
              height={headY}
              fill={`url(#thread-${bolt.id})`}
              opacity={0.35}
            />

            {/* ── Bolt tip (pointing up) ── */}
            <polygon
              points={`${CX},0 ${SHAFT_X},4 ${SHAFT_X + SHAFT_W},4`}
              fill={`url(#${shaftGradId})`}
            />

            {/* ── Thread marks (diagonal cuts just below the tip) ── */}
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`t${i}`}
                x1={SHAFT_X}
                y1={5 + i * 3 + 1}
                x2={SHAFT_X + SHAFT_W}
                y2={5 + i * 3 + 3}
                stroke="var(--shaft-mid)"
                strokeWidth="0.9"
              />
            ))}

            {/* ── Empty slot ghost outlines ── */}
            {Array.from({ length: effectiveCapacity }).map((_, slotIdx) => {
              if (slotIdx < bolt.nuts.length) return null;
              const y = nutTop(slotIdx, effectiveCapacity);
              // hex points (flat-top hexagon)
              const x0 = NUT_X + 0.25 * NUT_W;
              const x1 = NUT_X + 0.75 * NUT_W;
              const x2 = NUT_X + NUT_W;
              const x3 = x1;
              const x4 = x0;
              const x5 = NUT_X;
              const y0 = y;
              const y1 = y + NUT_H / 2;
              const y2 = y + NUT_H;
              const points = [
                { x: x0, y: y0 },
                { x: x1, y: y0 },
                { x: x2, y: y1 },
                { x: x3, y: y2 },
                { x: x4, y: y2 },
                { x: x5, y: y1 },
              ];
              // draw a pill (rounded rect) for ghost slot
              return (
                <rect
                  key={`ghost-${slotIdx}`}
                  x={NUT_X}
                  y={y}
                  width={NUT_W}
                  height={NUT_H}
                  rx={NUT_H / 2}
                  fill="none"
                  stroke="var(--ghost-stroke)"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
              );
            })}

            {/* ── Filled nuts (index 0 = bottommost slot near head) ── */}
            {bolt.nuts.map((colorId, slotIdx) => {
              const colorIndex = parseInt(colorId.replace(/^c/, ''), 10) || 0;
              const color = palette.colors[colorIndex % palette.colors.length];
              const y = nutTop(slotIdx, effectiveCapacity);
              const holeCY = y + NUT_H / 2;
              const gradId = `nutgrad-${bolt.id}-${slotIdx}`;
              const x0 = NUT_X + 0.25 * NUT_W;
              const x1 = NUT_X + 0.75 * NUT_W;
              const x2 = NUT_X + NUT_W;
              const x3 = x1;
              const x4 = x0;
              const x5 = NUT_X;
              const y0 = y;
              const y1 = y + NUT_H / 2;
              const y2 = y + NUT_H;
              const points = [
                { x: x0, y: y0 },
                { x: x1, y: y0 },
                { x: x2, y: y1 },
                { x: x3, y: y2 },
                { x: x4, y: y2 },
                { x: x5, y: y1 },
              ];
              return (
                <g key={`${bolt.id}-${slotIdx}-${colorId}`} data-nut-index={slotIdx} data-nut-id={colorId}>
                  <defs>
                    <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={lighten(color, 0.18)} stopOpacity="1" />
                      <stop offset="55%" stopColor={color} stopOpacity="1" />
                      <stop offset="100%" stopColor={darken(color, 0.18)} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  {/* Nut pill (rounded rect) with gradient + stroke + subtle inner highlight */}
                  <rect
                    x={NUT_X}
                    y={y}
                    width={NUT_W}
                    height={NUT_H}
                    rx={NUT_H / 2}
                    fill={`url(#${gradId})`}
                    stroke="var(--nut-stroke)"
                    strokeWidth={0.8}
                    filter={`url(#${dsFilterId})`}
                  />
                  {/* top sheen as smaller rounded rect */}
                  <rect
                    x={NUT_X + 8}
                    y={y + 4}
                    width={NUT_W - 16}
                    height={Math.max(4, Math.round(NUT_H * 0.18))}
                    rx={2}
                    fill="var(--sheen-color)"
                    opacity={0.9}
                  />
                </g>
              );
            })}

            {/* ── Bolt head at bottom (drawn last so it renders over shaft) ── */}
            {/* Top chamfer — shaft widens into the head */}
            <line
              x1={HEAD_X}
              y1={headY + 2}
              x2={HEAD_X + 8}
              y2={headY}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1"
            />
            <line
              x1={HEAD_X + HEAD_W}
              y1={headY + 2}
              x2={HEAD_X + HEAD_W - 8}
              y2={headY}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1"
            />
            <rect
              x={HEAD_X}
              y={headY + 2}
              width={HEAD_W}
              height={HEAD_H - 2}
              rx="10"
              fill={`url(#${headGradId})`}
              stroke="var(--head-grad-dark)"
              strokeWidth="1"
            />
            {/* Hex face lines */}
            <line
              x1={HEAD_X + 13}
              y1={headY + 2}
              x2={HEAD_X + 13}
              y2={svgH - 2}
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="0.8"
            />
            <line
              x1={HEAD_X + HEAD_W - 13}
              y1={headY + 2}
              x2={HEAD_X + HEAD_W - 13}
              y2={svgH - 2}
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="0.8"
            />
            {/* Top-edge highlight on head */}
            <rect
              x={HEAD_X + 3}
              y={headY + 4}
              width={HEAD_W - 6}
              height={3}
              rx="1"
              fill="var(--sheen-color)"
            />
            {/* rounded platform/base under the head */}
            <defs>
              <linearGradient id={platformGradId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--surface-container-low)" />
                <stop offset="100%" stopColor="var(--surface-container-high)" />
              </linearGradient>
            </defs>
            <rect
              x={HEAD_X - 10}
              y={headY + HEAD_H - 2}
              width={HEAD_W + 20}
              height={16}
              rx="8"
              fill={`url(#${platformGradId})`}
              stroke="rgba(228,226,229,0.03)"
            />
            <ellipse
              cx={CX}
              cy={headY + HEAD_H + 10}
              rx={(HEAD_W + 24) / 2}
              ry={8}
              fill="var(--ambient-shadow-strong)"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>

      {/* Debug labels shown below the bolt: stack index only (bottom->top) */}
      {showDebug && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
          aria-hidden="true"
        >
          {bolt.nuts.map((_, i) => {
            return (
              <div
                key={`${bolt.id}-lbl-${i}`}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'var(--on-surface-variant)',
                  color: '#111827',
                  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.08)',
                }}
              >
                {i}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
