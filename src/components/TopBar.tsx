import React, { useState } from 'react';
import { PALETTES } from '../lib/palettes';
import type { PaletteId } from '../lib/types';

type Props = {
    level: number;
    difficulty: string;
    seed?: string;
    paletteId: PaletteId;
    showDebug?: boolean;
    onShowDebugChange?: (show: boolean) => void;
    onPaletteChange: (id: PaletteId) => void;
    onDifficultyChange?: (d: string) => void;
    onSeedChange?: (seed: string) => void;
};

export default function TopBar({ level, difficulty, seed, paletteId, showDebug = false, onShowDebugChange, onPaletteChange, onDifficultyChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');
    const [open, setOpen] = useState(false);


    return (
        <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                    <strong>Level</strong>: {level}
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>Difficulty</strong>:
                        <select value={difficulty} onChange={(e) => onDifficultyChange?.(e.target.value)}>
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                            <option value="extreme">extreme</option>
                        </select>
                    </label>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input
                        type="checkbox"
                        checked={showDebug}
                        onChange={(e) => onShowDebugChange?.(e.target.checked)}
                    />
                    <span>Show debug</span>
                </label>
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
                <div style={{ position: 'relative' }}>
                    <button
                        aria-haspopup="true"
                        aria-expanded={open}
                        onClick={() => setOpen((o) => !o)}
                        style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: 'var(--surface-container-high)', border: '1px solid var(--ghost-stroke)', color: 'var(--text)' }}
                    >
                        <div style={{ display: 'flex', gap: 4 }}>
                            {PALETTES.find((p) => p.id === paletteId)?.colors.slice(0, 5).map((c, i) => (
                                <span key={i} style={{ width: 14, height: 14, background: c, borderRadius: 3, display: 'inline-block', border: '1px solid rgba(0,0,0,0.06)' }} />
                            ))}
                        </div>
                        <span style={{ marginLeft: 8 }}>{PALETTES.find((p) => p.id === paletteId)?.name}</span>
                    </button>
                    {open && (
                        <div style={{ position: 'absolute', right: 0, marginTop: 8, background: 'var(--surface-container-high)', border: '1px solid var(--ghost-stroke)', borderRadius: 8, padding: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                            {PALETTES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { onPaletteChange(p.id); setOpen(false); }}
                                    style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text)' }}
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
