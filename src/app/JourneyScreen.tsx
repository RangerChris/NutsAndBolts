import React from 'react';
import { loadProgress, setSeedForDifficulty, setCurrentLevel } from '../lib/persistence';
import type { Difficulty } from '../lib/types';

type Props = {
    onPlayLevel: (difficulty: Difficulty, level: number, seed: string) => void;
    onBack?: () => void;
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];
const LEVELS_PER_DIFFICULTY = 10;

function levelSeed(d: Difficulty, level: number) {
    return `journey-${d}-${level}`;
}

function completedLevels(diffEntry: { completed?: number[] } | undefined): number[] {
    return Array.isArray(diffEntry?.completed) ? diffEntry.completed : [];
}

function LevelButton({
    d,
    level,
    completed,
    onPlayLevel,
}: {
    d: Difficulty;
    level: number;
    completed: boolean;
    onPlayLevel: Props['onPlayLevel'];
}) {
    const onClick = () => {
        const s = levelSeed(d, level);
        try { setCurrentLevel(d, level); } catch { }
        try { setSeedForDifficulty(d, s); } catch { }
        onPlayLevel(d, level, s);
    };
    return (
        <button className="control-btn journey-level-btn" onClick={onClick}>
            <div className="journey-level-btn-content">
                <div className="journey-level-btn-star">{completed ? '★' : '☆'}</div>
                <div className="journey-level-btn-label">{level}</div>
            </div>
        </button>
    );
}

export default function JourneyScreen({ onPlayLevel, onBack }: Props) {
    const progress = loadProgress();

    return (
        <div className="journey-screen">
            <div className="journey-header">
                <div>
                    <button className="control-btn" onClick={() => onBack?.()}>Back</button>
                </div>
                <div className="journey-heading-copy">
                    <h2 className="journey-title">Journey Levels</h2>
                    <p className="journey-subtitle">Choose a tier and clear levels to build your completion streak.</p>
                </div>
            </div>
            <div className="journey-difficulty-list">
                {DIFFICULTIES.map((d) => {
                    const completed = completedLevels(progress.difficulties?.[d]);
                    return (
                        <div key={d} className="journey-difficulty-card">
                            <div className="journey-difficulty-head">
                                <h3 className="journey-difficulty-title">{d}</h3>
                                <div className="muted">Completed: {completed.length}</div>
                            </div>
                            <div className="journey-level-grid">
                                {Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) => {
                                    const level = i + 1;
                                    return (
                                        <LevelButton
                                            key={`${d}-${level}`}
                                            d={d}
                                            level={level}
                                            completed={completed.includes(level)}
                                            onPlayLevel={onPlayLevel}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
