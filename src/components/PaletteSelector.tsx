import React from 'react';
import { PALETTES } from '../lib/palettes';
import type { PaletteId } from '../lib/types';

type Props = {
    selected: PaletteId;
    onChange: (id: PaletteId) => void;
};

export default function PaletteSelector({ selected, onChange }: Props) {
    return (
        <div className="palette-selector">
            {PALETTES.map((p) => (
                <button
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    className={`palette-select-btn ${p.id === selected ? 'selected' : ''}`}
                >
                    <div className="palette-preview">
                        {p.colors.slice(0, 5).map((c, i) => (
                            <svg key={i} width={16} height={16} className="palette-swatch-lg" aria-hidden>
                                <rect width="100%" height="100%" rx="3" fill={c} />
                            </svg>
                        ))}
                    </div>
                    <span className="palette-name">{p.name}</span>
                </button>
            ))}
        </div>
    );
}
