import React from 'react';
import { loadProgress, setSeedForDifficulty, setCurrentLevel } from '../lib/persistence';
import type { Difficulty } from '../lib/types';

type Props = {
    onPlayLevel: (difficulty: Difficulty, level: number, seed: string) => void;
    onBack?: () => void;
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];

function levelSeed(d: Difficulty, level: number) {
    return `journey-${d}-${level}`;
}

export default function JourneyScreen({ onPlayLevel, onBack }: Props) {
    const progress = loadProgress();

    const makeButton = (d: Difficulty, level: number) => {
        const diffEntry = progress.difficulties?.[d];
        const completed = Array.isArray(diffEntry?.completed) ? diffEntry.completed.includes(level) : false;
        const star = completed ? '★' : '☆';
        const label = `${level}`;
        const onClick = () => {
            const s = levelSeed(d, level);
            try { setCurrentLevel(d, level); } catch { }
            try { setSeedForDifficulty(d, s); } catch { }
            onPlayLevel(d, level, s);
        };
        return (
            <button key={`${d}-${level}`} className="control-btn journey-level-btn" onClick={onClick}>
                <div className="journey-level-btn-content">
                    <div className="journey-level-btn-star">{star}</div>
                    <div className="journey-level-btn-label">{label}</div>
                </div>
            </button>
        );
    };

    return (
        <div className="journey-screen">
            <div className="journey-header">
                <div>
                    <button className="control-btn" onClick={() => onBack?.()}>Back</button>
                </div>
                <h2 className="journey-title">Journey Levels</h2>
            </div>
            <div className="journey-difficulty-list">
                {DIFFICULTIES.map((d) => {
                    const diffEntry = progress.difficulties?.[d];
                    const completedArr: number[] = Array.isArray(diffEntry?.completed) ? diffEntry.completed : [];
                    const completedCount = completedArr.length;
                    return (
                        <div key={d} className="journey-difficulty-card">
                            <div className="journey-difficulty-head">
                                <h3 className="journey-difficulty-title">{d}</h3>
                                <div className="muted">Completed: {completedCount}</div>
                            </div>
                            <div className="journey-level-grid">
                                {Array.from({ length: 10 }).map((_, i) => makeButton(d, i + 1))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
