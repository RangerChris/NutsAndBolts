import React from 'react';
import type { Bolt as BoltType } from '../lib/types';
import { getPalette } from '../lib/palettes';

type Props = {
    bolt: BoltType;
    paletteId: number;
    selected?: boolean;
    invalid?: boolean;
    onClick?: (id: string) => void;
};

// === Side-view bolt dimensions — tip at TOP, head at BOTTOM ===
const W = 120;                              // SVG width
const CX = W / 2;                           // center x = 60
const HEAD_W = 64;                          // bolt head width (keep original)
const HEAD_H = 32;                          // bolt head height
const HEAD_X = (W - HEAD_W) / 2;           // center head
const SHAFT_W = 28;                         // shaft (screw) width — increased
const SHAFT_X = CX - SHAFT_W / 2;          // shaft x derived from CX
const SLOT_H = 30;                          // height per nut slot
const NUT_H = 20;                           // nut rectangle height (keep original)
const NUT_W = 66;                           // nut rectangle width (original width)
const NUT_X = (W - NUT_W) / 2;             // centered under wider bolt
const NUT_Y_PAD = (SLOT_H - NUT_H) / 2;   // vertical padding in slot = 3
const THREAD_H = 22;                        // pointed tip + thread section at top
const TOP_PAD = 8;                          // extra space above the tip so top nut isn't clipped

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

export default function BoltView({ bolt, paletteId, selected = false, invalid = false, onClick }: Props) {
    const palette = getPalette(paletteId);
    const capacity = bolt.capacity;
    const headY = THREAD_H + capacity * SLOT_H;   // y where head begins (relative to drawing origin)
    const svgH = headY + HEAD_H + TOP_PAD;        // add extra top padding to overall svg height
    // Ensure the bolt is always visible by scaling it down if it would exceed
    // the available display height. Use the viewport height (when available)
    // so tall bolts scale to fit smaller screens rather than being clipped.
    const DEFAULT_MAX = 320; // fallback
    let MAX_DISPLAY_HEIGHT = DEFAULT_MAX;
    if (typeof window !== 'undefined' && typeof window.innerHeight === 'number') {
        // leave some room for topbar/controls; clamp to a reasonable max
        MAX_DISPLAY_HEIGHT = Math.max(DEFAULT_MAX, Math.min(window.innerHeight - 160, 900));
    }
    const scale = svgH > MAX_DISPLAY_HEIGHT ? MAX_DISPLAY_HEIGHT / svgH : 1;
    const headGradId = `head-${bolt.id}`;
    const shaftGradId = `shaft-${bolt.id}`;

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
                        {/* Bolt head gradient (top-lit) */}
                        <linearGradient id={headGradId} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f3f4f6" />
                            <stop offset="100%" stopColor="#9ca3af" />
                        </linearGradient>
                        {/* Shaft gradient (side-lit — lighter in center) */}
                        <linearGradient id={shaftGradId} x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#7d8898" />
                            <stop offset="35%" stopColor="#c5cad3" />
                            <stop offset="65%" stopColor="#c5cad3" />
                            <stop offset="100%" stopColor="#7d8898" />
                        </linearGradient>
                    </defs>

                    <g transform={`translate(0, ${TOP_PAD})`}>
                        {/* ── Shaft (full height from tip down to top of head) ── */}
                        <rect x={SHAFT_X} y={0} width={SHAFT_W} height={headY}
                            fill={`url(#${shaftGradId})`} />

                        {/* ── Bolt tip (pointing up) ── */}
                        <polygon
                            points={`${CX},0 ${SHAFT_X},4 ${SHAFT_X + SHAFT_W},4`}
                            fill={`url(#${shaftGradId})`} />

                        {/* ── Thread marks (diagonal cuts just below the tip) ── */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <line key={`t${i}`}
                                x1={SHAFT_X} y1={5 + i * 3 + 1}
                                x2={SHAFT_X + SHAFT_W} y2={5 + i * 3 + 3}
                                stroke="#8a9099" strokeWidth="0.9" />
                        ))}

                        {/* ── Empty slot ghost outlines ── */}
                        {Array.from({ length: capacity }).map((_, slotIdx) => {
                            if (slotIdx < bolt.nuts.length) return null;
                            const y = nutTop(slotIdx, capacity);
                            return (
                                <rect key={`ghost-${slotIdx}`}
                                    x={NUT_X} y={y} width={NUT_W} height={NUT_H} rx="2"
                                    fill="none" stroke="#d1d5db"
                                    strokeWidth="1" strokeDasharray="5 3" />
                            );
                        })}

                        {/* ── Filled nuts (index 0 = bottommost slot near head) ── */}
                        {bolt.nuts.map((colorId, slotIdx) => {
                            const colorIndex = parseInt(colorId.replace(/^c/, ''), 10) || 0;
                            const color = palette.colors[colorIndex % palette.colors.length];
                            const y = nutTop(slotIdx, capacity);
                            const holeCY = y + NUT_H / 2;
                            return (
                                <g key={`${bolt.id}-${slotIdx}-${colorId}`} data-nut-index={slotIdx}>
                                    {/* Nut body */}
                                    <rect x={NUT_X} y={y} width={NUT_W} height={NUT_H} rx="2"
                                        fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
                                    {/* Chamfer lines — suggest hex faces */}
                                    <line x1={NUT_X} y1={y} x2={NUT_X + 8} y2={y + NUT_H}
                                        stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                                    <line x1={NUT_X + NUT_W} y1={y} x2={NUT_X + NUT_W - 8} y2={y + NUT_H}
                                        stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                                    {/* Thread hole (where bolt shaft passes through the nut) */}
                                    <ellipse cx={CX} cy={holeCY} rx={7} ry={NUT_H / 2 - 1}
                                        fill="rgba(0,0,0,0.30)" />
                                    <ellipse cx={CX} cy={holeCY} rx={5} ry={NUT_H / 2 - 2}
                                        fill="rgba(0,0,0,0.15)" stroke="#333" strokeWidth="0.3" />
                                    {/* Top-edge highlight */}
                                    <rect x={NUT_X + 3} y={y + 2} width={NUT_W - 6} height={2} rx="1"
                                        fill="rgba(255,255,255,0.28)" />
                                </g>
                            );
                        })}

                        {/* ── Bolt head at bottom (drawn last so it renders over shaft) ── */}
                        {/* Top chamfer — shaft widens into the head */}
                        <line x1={HEAD_X} y1={headY + 2} x2={HEAD_X + 8} y2={headY}
                            stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                        <line x1={HEAD_X + HEAD_W} y1={headY + 2} x2={HEAD_X + HEAD_W - 8} y2={headY}
                            stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                        <rect x={HEAD_X} y={headY + 2} width={HEAD_W} height={HEAD_H - 2} rx="3"
                            fill={`url(#${headGradId})`} stroke="#9ca3af" strokeWidth="1" />
                        {/* Hex face lines */}
                        <line x1={HEAD_X + 13} y1={headY + 2} x2={HEAD_X + 13} y2={svgH - 2}
                            stroke="rgba(0,0,0,0.10)" strokeWidth="0.8" />
                        <line x1={HEAD_X + HEAD_W - 13} y1={headY + 2} x2={HEAD_X + HEAD_W - 13} y2={svgH - 2}
                            stroke="rgba(0,0,0,0.10)" strokeWidth="0.8" />
                        {/* Top-edge highlight on head */}
                        <rect x={HEAD_X + 3} y={headY + 4} width={HEAD_W - 6} height={3} rx="1"
                            fill="rgba(255,255,255,0.40)" />
                    </g>
                </svg>
            </div>
        </div >
    );
}
