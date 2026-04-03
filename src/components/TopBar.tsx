import React, { useState } from 'react';
import PaletteSelector from './PaletteSelector';
import type { PaletteId } from '../lib/types';

type Props = {
    level: number;
    difficulty: string;
    seed?: string;
    paletteId: PaletteId;
    onPaletteChange: (id: PaletteId) => void;
    onSeedChange?: (seed: string) => void;
};

export default function TopBar({ level, difficulty, seed, paletteId, onPaletteChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');

    return (
        <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                    <strong>Level</strong>: {level}
                </div>
                <div>
                    <strong>Difficulty</strong>: {difficulty}
                </div>
                <div>
                    <strong>Seed</strong>:{' '}
                    {!editingSeed ? (
                        <span>
                            {seedValue || '—'}{' '}
                            <button onClick={() => setEditingSeed(true)} style={{ marginLeft: 8 }}>Edit</button>
                        </span>
                    ) : (
                        <span>
                            <input value={seedValue} onChange={(e) => setSeedValue(e.target.value)} style={{ marginRight: 8 }} />
                            <button onClick={() => { setEditingSeed(false); onSeedChange?.(seedValue); }}>Save</button>
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <PaletteSelector selected={paletteId} onChange={onPaletteChange} />
            </div>
        </div>
    );
}
