import React, { useState } from 'react';
import type { PlayMode } from '../lib/types';
import { loadProgress } from '../lib/persistence';

type Props = {
    level: number;
    difficulty: string;
    seed?: string;
    playMode?: PlayMode;
    showSeed?: boolean;
    showDebug?: boolean;
    onShowDebugChange?: (show: boolean) => void;
    forceHidden?: boolean;
    onForceHiddenChange?: (v: boolean) => void;
    // difficulty may not be changed in-game; selection occurs when starting a session
    onSeedChange?: (seed: string) => void;
};

export default function TopBar({ level, difficulty, seed, playMode = 'journey', showSeed = true, showDebug = false, onShowDebugChange, forceHidden = false, onForceHiddenChange, onDifficultyChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');


    return (
        <div className="topbar topbar-root">
            <div className="topbar-left">
                {playMode === 'endless' ? (
                    <div>
                        <strong>Endless</strong>: {(() => {
                            try {
                                const p = loadProgress();
                                const arr = p.difficulties?.[difficulty]?.completed || [];
                                return `Completed ${arr.length}`;
                            } catch { return '' }
                        })()}
                    </div>
                ) : (
                    playMode !== 'daily' && (
                        <div>
                            <strong>Level</strong>: {level}
                        </div>
                    )
                )}
            </div>
            <div className="topbar-controls">
                {/* Difficulty selection removed from in-game TopBar. Choose difficulty when starting Journey/Endless from Home screen. */}
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
                {/* Palette selection removed — single Bold Spectrum palette used */}
            </div>
        </div>
    );
}
