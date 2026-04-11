import React, { useState } from 'react';
import type { PlayMode, Difficulty } from '../lib/types';
import { getDailySeed } from '../lib/daily';
import { getDailyLastCompleted } from '../lib/persistence';

type Props = {
    onSelectMode: (mode: PlayMode, opts?: { difficulty?: Difficulty; seed?: string }) => void;
};

export default function HomeScreen({ onSelectMode }: Props) {
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');

    const [openEndless, setOpenEndless] = useState(false);

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
                        {(() => {
                            try {
                                const today = getDailySeed().slice('daily-v1-'.length);
                                if (getDailyLastCompleted() === today) {
                                    return <div style={{ marginTop: 8 }}><span style={{ background: 'var(--primary)', color: '#3a1200', padding: '4px 8px', borderRadius: 12, fontWeight: 800 }}>Completed today</span></div>;
                                }
                            } catch { }
                            return null;
                        })()}
                    </div>
                </button>

                {/* Custom Seed option removed per request */}

                <button onClick={() => setOpenEndless(true)} className="mode-card" aria-label="Endless Mode">
                    <div className="mode-icon-placeholder" aria-hidden="true"></div>
                    <div className="mode-content">
                        <div className="mode-title">Endless</div>
                        <div className="mode-desc">Keep solving generated puzzles — a fresh challenge every win.</div>
                    </div>
                </button>
            </div>

            <div className="home-controls">
                <button data-testid="help-tutorial" className="help-btn" onClick={() => onSelectMode('tutorial')}>Help / Tutorial</button>
            </div>
            {openEndless && (
                <div className="complete-overlay" role="dialog" aria-modal="true">
                    <div className="complete-modal">
                        <h2 className="complete-title">Endless Mode</h2>
                        <p className="complete-sub">Choose difficulty for Endless mode:</p>
                        <div style={{ marginBottom: 12 }}>
                            <label>
                                Difficulty:
                                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} style={{ marginLeft: 8 }}>
                                    <option value="easy">easy</option>
                                    <option value="medium">medium</option>
                                    <option value="hard">hard</option>
                                    <option value="extreme">extreme</option>
                                </select>
                            </label>
                        </div>
                        <div style={{ width: '100%' }}>
                            <button className="primary-cta" onClick={() => { setOpenEndless(false); onSelectMode('endless', { difficulty }); }}>Play Endless</button>
                            <div className="secondary-actions" style={{ justifyContent: 'center' }}>
                                <button className="control-btn" onClick={() => setOpenEndless(false)} style={{ marginTop: 12 }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
