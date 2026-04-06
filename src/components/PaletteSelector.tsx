import React from 'react';
import { PALETTES } from '../lib/palettes';
import type { PaletteId } from '../lib/types';

type Props = {
    selected: PaletteId;
    onChange: (id: PaletteId) => void;
};

export default function PaletteSelector({ selected, onChange }: Props) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {PALETTES.map((p) => (
                <button
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    aria-pressed={p.id === selected}
                    style={{
                        border: p.id === selected ? '2px solid var(--primary-container)' : '1px solid var(--ghost-stroke)',
                        padding: 6,
                        borderRadius: 6,
                        background: 'var(--surface-container-high)',
                        color: 'var(--text)',
                        display: 'flex',
                        gap: 4,
                        alignItems: 'center',
                    }}
                >
                    <div style={{ display: 'flex', gap: 2 }}>
                        {p.colors.slice(0, 5).map((c, i) => (
                            <span key={i} style={{ width: 16, height: 16, background: c, borderRadius: 3, display: 'inline-block' }} />
                        ))}
                    </div>
                    <span style={{ marginLeft: 8 }}>{p.name}</span>
                </button>
            ))}
        </div>
    );
}
