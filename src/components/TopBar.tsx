import React, { useState, useEffect } from 'react';
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

function getEndlessCountLabel(difficulty: string): string {
    try {
        const p = loadProgress();
        const count = p.difficulties?.[difficulty]?.endlessCount ?? 0;
        return `${difficulty} • Completed ${count}`;
    } catch {
        return '';
    }
}

export default function TopBar({ level, difficulty, seed, playMode = 'journey', showSeed = true, showDebug = false, onShowDebugChange, forceHidden = false, onForceHiddenChange, onSeedChange }: Props) {
    const [editingSeed, setEditingSeed] = useState(false);
    const [seedValue, setSeedValue] = useState(seed || '');

    useEffect(() => {
        if (!editingSeed) setSeedValue(seed || '');
    }, [seed, editingSeed]);

    const saveSeed = () => {
        setEditingSeed(false);
        onSeedChange?.(seedValue);
    };

    const cancelEdit = () => {
        setSeedValue(seed || '');
        setEditingSeed(false);
    };

    const handleSeedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') saveSeed();
        else if (e.key === 'Escape') cancelEdit();
    };

    return (
        <div className="topbar topbar-root">
            <div className="topbar-left">
                {playMode === 'endless' ? (
                    <div className="topbar-status">
                        <strong>Endless</strong>: {getEndlessCountLabel(difficulty)}
                    </div>
                ) : playMode !== 'daily' ? (
                    <div className="topbar-status">
                        <strong>Level</strong>: {level}
                    </div>
                ) : null}
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
                                    checked={forceHidden}
                                    onChange={(e) => onForceHiddenChange?.(e.target.checked)}
                                />
                                <span>Force Hidden Nuts</span>
                            </label>
                        )}
                        <div className="topbar-seed topbar-pill">
                            <strong>Seed</strong>:{' '}
                            {!editingSeed ? (
                                <span>
                                    <span className="topbar-seed-value">{seedValue || '—'}</span>{' '}
                                    <button onClick={() => setEditingSeed(true)} className="topbar-btn-edit">Edit</button>{' '}
                                    <button
                                        className="topbar-btn-copy"
                                        onClick={() => { try { navigator.clipboard.writeText(seedValue); } catch { } }}
                                        title="Copy seed"
                                    >Copy</button>
                                </span>
                            ) : (
                                <span>
                                    <input
                                        aria-label="Seed"
                                        value={seedValue}
                                        onChange={(e) => setSeedValue(e.target.value)}
                                        onKeyDown={handleSeedKeyDown}
                                        className="topbar-input-seed"
                                        autoFocus
                                    />{' '}
                                    <button onClick={saveSeed}>Save</button>{' '}
                                    <button onClick={cancelEdit}>Cancel</button>
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
