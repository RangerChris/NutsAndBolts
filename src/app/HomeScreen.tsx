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
                <button onClick={() => onSelectMode('journey', { difficulty })} className="mode-card">Journey</button>
                <button onClick={() => onSelectMode('daily')} className="mode-card">Daily</button>
                <button onClick={() => onSelectMode('custom', { difficulty, seed })} className="mode-card">Custom Seed</button>
                <button onClick={() => onSelectMode('endless', { difficulty })} className="mode-card">Endless</button>
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

                <button className="help-btn" onClick={() => onSelectMode('tutorial')}>Help / Tutorial</button>
            </div>
        </div>
    );
}
