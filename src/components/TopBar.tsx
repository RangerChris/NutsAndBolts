import React, { useState } from 'react';
import { PALETTES } from '../lib/palettes';
import type { PaletteId, PlayMode } from '../lib/types';
import { getDailySeed } from '../lib/daily';

type Props = {
    level: number;
    difficulty: string;
    seed?: string;
    playMode?: PlayMode;
    showSeed?: boolean;
    paletteId: PaletteId;
    showDebug?: boolean;
    onShowDebugChange?: (show: boolean) => void;
    forceHidden?: boolean;
    onForceHiddenChange?: (v: boolean) => void;
    onPaletteChange: (id: PaletteId) => void;
    onDifficultyChange?: (d: string) => void;
    onSeedChange?: (seed: string) => void;
};

export default function TopBar({ level, difficulty, seed, playMode = 'journey', showSeed = true, paletteId, showDebug = false, onShowDebugChange, forceHidden = false, onForceHiddenChange, onPaletteChange, onDifficultyChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');
    const [open, setOpen] = useState(false);


    return (
        <div className="topbar topbar-root">
            <div className="topbar-left">
                {playMode === 'daily' ? (
                    <div>
                        <strong>Daily</strong>: {getDailySeed().slice('daily-v1-'.length)}
                    </div>
                ) : (
                    <div>
                        <strong>Level</strong>: {level}
                    </div>
                )}
                <div>
                    <label className="topbar-difficulty">
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
            <div className="topbar-controls">
                {showSeed && (
                    <>
                        <label className="topbar-debug">
                            <input
                                type="checkbox"
                                checked={showDebug}
                                onChange={(e) => onShowDebugChange?.(e.target.checked)}
                            />
                            <span>Show debug</span>
                        </label>
                        {showDebug && (
                            <label className="topbar-debug">
                                <input
                                    type="checkbox"
                                    checked={Boolean(forceHidden)}
                                    onChange={(e) => onForceHiddenChange?.(e.target.checked)}
                                />
                                <span>Force Hidden Nuts</span>
                            </label>
                        )}
                        <div className="topbar-seed">
                            <strong>Seed</strong>:{' '}
                            {!editingSeed ? (
                                <span>
                                    {seedValue || '—'}{' '}
                                    <button onClick={() => setEditingSeed(true)} className="topbar-btn-edit">Edit</button>
                                </span>
                            ) : (
                                <span>
                                    <input aria-label="Seed" value={seedValue} onChange={(e) => setSeedValue(e.target.value)} className="topbar-input-seed" />
                                    <button onClick={() => { setEditingSeed(false); onSeedChange?.(seedValue); }}>Save</button>
                                </span>
                            )}
                        </div>
                    </>
                )}
                <div className="palette-root">
                    <button
                        aria-haspopup="true"
                        onClick={() => setOpen((o) => !o)}
                        className="palette-button"
                    >
                        <div className="palette-preview">
                            {PALETTES.find((p) => p.id === paletteId)?.colors.slice(0, 5).map((c, i) => (
                                <svg key={i} width={14} height={14} className="palette-swatch" aria-hidden>
                                    <rect width="100%" height="100%" rx="3" fill={c} stroke="rgba(0,0,0,0.06)" />
                                </svg>
                            ))}
                        </div>
                        <span className="palette-name">{PALETTES.find((p) => p.id === paletteId)?.name}</span>
                    </button>
                    {open && (
                        <div className="palette-popover">
                            {PALETTES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { onPaletteChange(p.id); setOpen(false); }}
                                    className="palette-list-button"
                                >
                                    <div className="palette-preview">
                                        {p.colors.slice(0, 5).map((c, i) => (
                                            <svg key={i} width={14} height={14} className="palette-swatch" aria-hidden>
                                                <rect width="100%" height="100%" rx="3" fill={c} stroke="rgba(0,0,0,0.06)" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="palette-name">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
