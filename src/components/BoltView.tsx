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

export default function BoltView({ bolt, paletteId, selected = false, invalid = false, onClick }: Props) {
    const palette = getPalette(paletteId);
    const accessibleName = `${bolt.id}, ${bolt.nuts.length} nut${bolt.nuts.length === 1 ? '' : 's'}`;

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={accessibleName}
            className={`bolt ${selected ? 'bolt-selected' : ''} ${invalid ? 'bolt-invalid' : ''}`}
            onClick={() => onClick?.(bolt.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.(bolt.id);
                }
            }}
            data-bolt={bolt.id}
        >
            <div className="bolt-header">
                <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                    <defs>
                        <linearGradient id={`g-${bolt.id}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f3f4f6" />
                            <stop offset="100%" stopColor="#d1d5db" />
                        </linearGradient>
                    </defs>
                    {/* hex head */}
                    <polygon points="18,3 27,9 27,21 18,27 9,21 9,9" fill={`url(#g-${bolt.id})`} stroke="#9ca3af" strokeWidth="0.5" />
                    {/* shaft */}
                    <rect x="15" y="27" width="6" height="6" fill="#c7ccd1" rx="2" />
                </svg>
                <div className="bolt-id">{bolt.id}</div>
            </div>

            <div className="nut-stack" style={{ display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
                {bolt.nuts.length === 0 && <div className="bolt-empty">empty</div>}
                {bolt.nuts.map((n, idx) => {
                    const colorIndex = parseInt(n.replace(/^c/, ''), 10) || 0;
                    const color = palette.colors[colorIndex % palette.colors.length];
                    const patternId = `pat-${paletteId}-${colorIndex % 3}`;
                    const dataIndex = idx; // stable index within bolt
                    return (
                        <svg
                            key={`${bolt.id}-${idx}-${n}`}
                            data-nut-index={dataIndex}
                            width="36"
                            height="32"
                            viewBox="0 0 36 32"
                            className="nut-svg"
                            aria-hidden="true"
                        >
                            <defs>
                                <pattern id={`${patternId}-dots`} patternUnits="userSpaceOnUse" width="6" height="6">
                                    <rect width="6" height="6" fill="transparent" />
                                    <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.28)" />
                                </pattern>
                                <pattern id={`${patternId}-stripes`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                                    <rect width="6" height="6" fill="transparent" />
                                    <rect x="0" y="0" width="3" height="6" fill="rgba(255,255,255,0.16)" />
                                </pattern>
                            </defs>
                            {/* hex nut */}
                            <polygon points="18,2 30,8 30,24 18,30 6,24 6,8" fill={color} stroke="#6b7280" strokeWidth="0.8" />
                            {/* inner hole */}
                            <circle cx="18" cy="16" r="5" fill="#f3f4f6" />
                            {/* pattern overlay */}
                            {colorIndex % 2 === 0 && <polygon points="18,2 30,8 30,24 18,30 6,24 6,8" fill={`url(#${patternId}-dots)`} />}
                            {colorIndex % 2 === 1 && <polygon points="18,2 30,8 30,24 18,30 6,24 6,8" fill={`url(#${patternId}-stripes)`} />}
                        </svg>
                    );
                })}
            </div>
        </div>
    );
}
