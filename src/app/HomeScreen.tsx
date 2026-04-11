import React, { useState } from 'react';
import type { PlayMode, Difficulty } from '../lib/types';

type Props = {
    onSelectMode: (mode: PlayMode, opts?: { difficulty?: Difficulty; seed?: string }) => void;
};

export default function HomeScreen({ onSelectMode }: Props) {
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [seed, setSeed] = useState('');

    return (
        <div className="home-screen">
            <h1>Nuts & Bolts</h1>
            <div className="mode-grid">
                <button onClick={() => onSelectMode('journey', { difficulty })} className="mode-card" aria-label="Start Journey">
                    <div className="mode-icon-placeholder" aria-hidden="true"></div>
                    <div className="mode-content">
                        <div className="mode-title">Journey</div>
                        <div className="mode-desc">Progress through curated puzzles and unlock new levels.</div>
                    </div>
                </button>

                <button onClick={() => onSelectMode('daily')} className="mode-card" aria-label="Play Daily">
                    <div className="mode-icon-placeholder" aria-hidden="true"></div>
                    <div className="mode-content">
                        <div className="mode-title">Daily</div>
                        <div className="mode-desc">One shared seeded puzzle per day — compete for best solutions.</div>
                    </div>
                </button>

                <button onClick={() => onSelectMode('custom', { difficulty, seed })} className="mode-card" aria-label="Custom Seed">
                    <div className="mode-icon-placeholder" aria-hidden="true"></div>
                    <div className="mode-content">
                        <div className="mode-title">Custom Seed</div>
                        <div className="mode-desc">Play any seed string to reproduce or share puzzles.</div>
                    </div>
                </button>

                <button onClick={() => onSelectMode('endless', { difficulty })} className="mode-card" aria-label="Endless Mode">
                    <div className="mode-icon-placeholder" aria-hidden="true"></div>
                    <div className="mode-content">
                        <div className="mode-title">Endless</div>
                        <div className="mode-desc">Keep solving generated puzzles — a fresh challenge every win.</div>
                    </div>
                </button>
            </div>

            <div className="home-controls">
                <label>
                    Difficulty:
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="hard">hard</option>
                        <option value="extreme">extreme</option>
                    </select>
                </label>

                <label>
                    Custom seed:
                    <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="seed string" />
                </label>

                <button data-testid="help-tutorial" className="help-btn" onClick={() => onSelectMode('tutorial')}>Help / Tutorial</button>
            </div>
        </div>
    );
}
