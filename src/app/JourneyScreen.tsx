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
        const diffEntry = progress.difficulties?.[d] as unknown;
        const completed = diffEntry && Array.isArray(diffEntry.completed) ? diffEntry.completed.includes(level) : false;
        const star = completed ? '★' : '☆';
        const label = `${level}`;
        const onClick = () => {
            const s = levelSeed(d, level);
            try { setCurrentLevel(d, level); } catch { }
            try { setSeedForDifficulty(d, s); } catch { }
            onPlayLevel(d, level, s);
        };
        return (
            <button key={`${d}-${level}`} className="control-btn" aria-pressed={completed} onClick={onClick} style={{ minWidth: 56 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{star}</div>
                    <div style={{ fontSize: 12 }}>{label}</div>
                </div>
            </button>
        );
    };

    return (
        <div className="journey-screen" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2>Journey Levels</h2>
                <div>
                    <button className="control-btn" onClick={() => onBack?.()}>Back</button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DIFFICULTIES.map((d) => {
                    const diffEntry = progress.difficulties?.[d] as unknown;
                    const completedArr: number[] = diffEntry && Array.isArray(diffEntry.completed) ? diffEntry.completed : [];
                    const completedCount = completedArr.length;
                    return (
                        <div key={d} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))', padding: 12, borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{d}</h3>
                                <div className="muted">Completed: {completedCount}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {Array.from({ length: 10 }).map((_, i) => makeButton(d, i + 1))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
