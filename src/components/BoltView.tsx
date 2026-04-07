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
  hiddenNuts?: boolean;

};

const W = 120;
const CX = W / 2;
const HEAD_W = 64;
const HEAD_H = 32;
const HEAD_X = (W - HEAD_W) / 2;
const SHAFT_W = 28;
const SHAFT_X = CX - SHAFT_W / 2;
const SLOT_H = 34;
const NUT_H = 26;
const NUT_W = 72;
const NUT_X = (W - NUT_W) / 2;
const NUT_Y_PAD = (SLOT_H - NUT_H) / 2;
const THREAD_H = 22;
const TOP_PAD = 8;

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



/** y-position (top edge) of slot i. slot 0 = bottommost (nearest head). */
function slotTop(slotIdx: number, capacity: number): number {
  return THREAD_H + (capacity - 1 - slotIdx) * SLOT_H;
}

/** y-position (top edge) of the nut rect within slot i. */
function nutTop(slotIdx: number, capacity: number): number {
  return slotTop(slotIdx, capacity) + NUT_Y_PAD;
}

export default function BoltView({
  bolt,
  paletteId,
  selected = false,
  invalid = false,
  showDebug = false,
  onClick,
  hiddenNuts = false,
}: Props) {
  const palette = getPalette(paletteId);
  const capacity = bolt.capacity;

  const effectiveCapacity = Math.max(capacity, bolt.nuts.length);
  const headY = THREAD_H + effectiveCapacity * SLOT_H; // y where head begins (relative to drawing origin)
  const svgH = headY + HEAD_H + TOP_PAD; // add extra top padding to overall svg height

  const DEFAULT_MAX = 320; // fallback
  let MAX_DISPLAY_HEIGHT = DEFAULT_MAX;
  if (typeof window !== 'undefined' && typeof window.innerHeight === 'number') {
    const avail = window.innerHeight - 160;

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



  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Bolt ${bolt.id}, ${bolt.nuts.length} of ${capacity} nuts`}
      className={`bolt ${selected ? 'bolt-selected' : ''} ${invalid ? 'bolt-invalid' : ''} bolt-root-inline`}
      onClick={() => onClick?.(bolt.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(bolt.id);
        }
      }}
      data-bolt={bolt.id}
    >
      <svg className="bolt-svg" width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`} aria-hidden="true">
        <g transform={`scale(${scale})`}>
          <defs>
            <filter id={dsFilterId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="var(--amb-shadow-color)" floodOpacity="0.9" />
            </filter>
            <linearGradient id={headGradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--head-grad-light)" />
              <stop offset="100%" stopColor="var(--head-grad-dark)" />
            </linearGradient>
            <linearGradient id={shaftGradId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--shaft-dark)" />
              <stop offset="35%" stopColor="var(--shaft-mid)" />
              <stop offset="65%" stopColor="var(--shaft-mid)" />
              <stop offset="100%" stopColor="var(--shaft-dark)" />
            </linearGradient>
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
            <defs>
              <radialGradient id={`amb-${bolt.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--amb-shadow-color)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--amb-shadow-color)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={CX} cy={svgH - 8} rx={HEAD_W * 0.9} ry={12} fill={`url(#amb-${bolt.id})`} />

            <rect x={SHAFT_X} y={0} width={SHAFT_W} height={headY} fill={`url(#${shaftGradId})`} />

            <rect
              x={SHAFT_X}
              y={0}
              width={SHAFT_W}
              height={headY}
              fill={`url(#thread-${bolt.id})`}
              opacity={0.35}
            />


            <polygon
              points={`${CX},0 ${SHAFT_X},4 ${SHAFT_X + SHAFT_W},4`}
              fill={`url(#${shaftGradId})`}
            />


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


            {Array.from({ length: effectiveCapacity }).map((_, slotIdx) => {
              if (slotIdx < bolt.nuts.length) return null;
              const y = nutTop(slotIdx, effectiveCapacity);
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


            {bolt.nuts.map((nut, slotIdx) => {
              const colorId = nut.color as string;
              const colorIndex = parseInt(colorId.replace(/^c/, ''), 10) || 0;
              const color = palette.colors[colorIndex % palette.colors.length];
              const isTop = slotIdx === bolt.nuts.length - 1;
              const isRevealed = Boolean(nut.revealed);
              const shouldHide = Boolean(hiddenNuts && !isTop && !isRevealed);
              const y = nutTop(slotIdx, effectiveCapacity);

              const gradId = `nutgrad-${bolt.id}-${slotIdx}`;

              return (
                <g key={`${bolt.id}-${slotIdx}-${nut.id}`} data-nut-index={slotIdx} data-nut-id={colorId} data-nut-instance={nut.id}>
                  <defs>
                    <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={lighten(color, 0.18)} stopOpacity="1" />
                      <stop offset="55%" stopColor={color} stopOpacity="1" />
                      <stop offset="100%" stopColor={darken(color, 0.18)} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <rect
                    x={NUT_X}
                    y={y}
                    width={NUT_W}
                    height={NUT_H}
                    rx={NUT_H / 2}
                    fill={shouldHide ? '#bdbdbd' : `url(#${gradId})`}
                    stroke={shouldHide ? 'rgba(0,0,0,0.12)' : 'var(--nut-stroke)'}
                    strokeWidth={0.8}
                    filter={shouldHide ? undefined : `url(#${dsFilterId})`}
                    data-hidden={shouldHide ? 'true' : undefined}
                  />
                  {!shouldHide && (
                    <rect
                      x={NUT_X + 8}
                      y={y + 4}
                      width={NUT_W - 16}
                      height={Math.max(4, Math.round(NUT_H * 0.18))}
                      rx={2}
                      fill="var(--sheen-color)"
                      opacity={0.9}
                    />
                  )}
                </g>
              );
            })}


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

            <rect
              x={HEAD_X + 3}
              y={headY + 4}
              width={HEAD_W - 6}
              height={3}
              rx="1"
              fill="var(--sheen-color)"
            />

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
        </g>
      </svg>


      {showDebug && (
        <div className="debug-labels" aria-hidden="true">
          {bolt.nuts.map((_, i) => {
            return (
              <div key={`${bolt.id}-lbl-${i}`} className="debug-label">
                {i}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
