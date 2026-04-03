import React, { useState } from 'react';
import { PALETTES } from '../lib/palettes';
import type { PaletteId } from '../lib/types';

type Props = {
    level: number;
    difficulty: string;
    seed?: string;
    paletteId: PaletteId;
    onPaletteChange: (id: PaletteId) => void;
    onDifficultyChange?: (d: string) => void;
    onSeedChange?: (seed: string) => void;
};

export default function TopBar({ level, difficulty, seed, paletteId, onPaletteChange, onDifficultyChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');
    const [open, setOpen] = useState(false);

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
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Difficulty:
                    <select value={difficulty} onChange={(e) => onDifficultyChange?.(e.target.value)}>
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="hard">hard</option>
                        <option value="extreme">extreme</option>
                    </select>
                </label>
                <div style={{ position: 'relative' }}>
                    <button
                        aria-haspopup="true"
                        aria-expanded={false}
                        onClick={() => setOpen((o) => !o)}
                        style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}
                    >
                        <div style={{ display: 'flex', gap: 4 }}>
                            {PALETTES.find((p) => p.id === paletteId)?.colors.slice(0, 5).map((c, i) => (
                                <span key={i} style={{ width: 14, height: 14, background: c, borderRadius: 3, display: 'inline-block', border: '1px solid rgba(0,0,0,0.06)' }} />
                            ))}
                        </div>
                        <span style={{ marginLeft: 8 }}>{PALETTES.find((p) => p.id === paletteId)?.name}</span>
                    </button>
                    {open && (
                        <div style={{ position: 'absolute', right: 0, marginTop: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                            {PALETTES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { onPaletteChange(p.id); setOpen(false); }}
                                    style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {p.colors.slice(0, 5).map((c, i) => (
                                            <span key={i} style={{ width: 14, height: 14, background: c, borderRadius: 3, display: 'inline-block', border: '1px solid rgba(0,0,0,0.06)' }} />
                                        ))}
                                    </div>
                                    <span style={{ marginLeft: 8 }}>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
