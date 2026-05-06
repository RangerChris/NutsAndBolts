import React, { useState } from 'react';
import type { PlayMode, Difficulty } from '../lib/types';
import { getDailySeed } from '../lib/daily';
import { getDailyLastCompleted, getSelectedDifficulty, setSelectedDifficulty } from '../lib/persistence';

type Props = {
    onSelectMode: (mode: PlayMode, opts?: { difficulty?: Difficulty; seed?: string }) => void;
};

export default function HomeScreen({ onSelectMode }: Props) {
    const [difficulty, setDifficulty] = useState<Difficulty>(() => (getSelectedDifficulty() as Difficulty) ?? 'easy');

    const [openEndless, setOpenEndless] = useState(false);

    return (
        <div className="home-screen">
            <div className="home-hero">
                <p className="home-kicker">Bright Logic Puzzle</p>
                <h1>Nuts & Bolts</h1>
                <p className="home-subtitle">Sort every stack into single-color bolts with slick controls built for touch and desktop play.</p>
            </div>
            <div className="mode-grid">
                <button onClick={() => onSelectMode('journey', { difficulty })} className="mode-card" aria-label="Start Journey">
                    <div className="mode-icon-placeholder" aria-hidden="true">
                        <svg className="mode-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M5 19V7L12 5V17L5 19Z" />
                            <path d="M12 17V5L19 7V19L12 17Z" />
                            <circle cx="8" cy="10" r="1.6" />
                            <circle cx="16" cy="14" r="1.6" />
                        </svg>
                    </div>
                    <div className="mode-content">
                        <div className="mode-title">Journey</div>
                        <div className="mode-desc">Progress through curated puzzles and unlock new levels.</div>
                    </div>
                </button>

                <button onClick={() => onSelectMode('daily')} className="mode-card" aria-label="Play Daily">
                    <div className="mode-icon-placeholder" aria-hidden="true">
                        <svg className="mode-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="4" y="5" width="16" height="15" rx="2" />
                            <path d="M8 3V7" />
                            <path d="M16 3V7" />
                            <path d="M4 9H20" />
                            <path d="M8 13H11" />
                            <path d="M13 13H16" />
                        </svg>
                    </div>
                    <div className="mode-content">
                        <div className="mode-title">Daily</div>
                        <div className="mode-desc">One shared seeded puzzle per day — compete for best solutions.</div>
                        {(() => {
                            try {
                                const today = getDailySeed().slice('daily-v1-'.length);
                                if (getDailyLastCompleted() === today) {
                                    return <div className="daily-completed-wrap"><span className="daily-completed-badge">Completed today</span></div>;
                                }
                            } catch { }
                            return null;
                        })()}
                    </div>
                </button>

                {/* Custom Seed option removed per request */}

                <button onClick={() => setOpenEndless(true)} className="mode-card" aria-label="Endless Mode">
                    <div className="mode-icon-placeholder" aria-hidden="true">
                        <svg className="mode-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 12C5.7 8.8 8.8 8.8 11 12C13.2 15.2 16.3 15.2 20 12C18.3 8.8 15.2 8.8 13 12C10.8 15.2 7.7 15.2 4 12Z" />
                        </svg>
                    </div>
                    <div className="mode-content">
                        <div className="mode-title">Endless</div>
                        <div className="mode-desc">Keep solving generated puzzles — a fresh challenge every win.</div>
                    </div>
                </button>

                <button data-testid="help-tutorial" onClick={() => onSelectMode('tutorial')} className="mode-card" aria-label="Help and Tutorial">
                    <div className="mode-icon-placeholder" aria-hidden="true">
                        <svg className="mode-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 6.5C4 5.7 4.7 5 5.5 5H11V19H5.5C4.7 19 4 18.3 4 17.5V6.5Z" />
                            <path d="M20 6.5C20 5.7 19.3 5 18.5 5H13V19H18.5C19.3 19 20 18.3 20 17.5V6.5Z" />
                            <path d="M11 7H13" />
                        </svg>
                    </div>
                    <div className="mode-content">
                        <div className="mode-title">Help / Tutorial</div>
                        <div className="mode-desc">Learn controls and mechanics with a guided walkthrough.</div>
                    </div>
                </button>
            </div>
            {openEndless && (
                <div className="complete-overlay" role="dialog" aria-modal="true">
                    <div className="complete-modal">
                        <h2 className="complete-title">Endless Mode</h2>
                        <p className="complete-sub">Choose difficulty for Endless mode:</p>
                        <div className="endless-difficulty-row">
                            <label className="endless-difficulty-label">
                                Difficulty:
                                <select className="endless-difficulty-select" value={difficulty} onChange={(e) => { const d = e.target.value as Difficulty; setDifficulty(d); try { setSelectedDifficulty(d); } catch { } }}>
                                    <option value="easy">easy</option>
                                    <option value="medium">medium</option>
                                    <option value="hard">hard</option>
                                    <option value="extreme">extreme</option>
                                </select>
                            </label>
                        </div>
                        <div className="endless-actions-wrap">
                            <button className="primary-cta" onClick={() => { setOpenEndless(false); onSelectMode('endless', { difficulty }); }}>Play Endless</button>
                            <div className="secondary-actions endless-secondary-actions">
                                <button className="control-btn endless-cancel-btn" onClick={() => setOpenEndless(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="home-version">
                Version: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}
            </div>
        </div>
    );
}
