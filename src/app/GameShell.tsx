import React, { useCallback, useEffect, useState, useRef } from 'react';
import type { GameState, PlayMode } from '../lib/types';
import { createLevel } from '../lib/generator';
import {
    undoLastMove,
    isWin,
    executeMoveOnState,
    getMovableTopCount,
    computeStars,
    computeSolutionPath,
} from '../lib/engine';
import Board, { type AnimMove, type HintPreview } from '../components/Board';
import BottomBar from '../components/BottomBar';
import TopBar from '../components/TopBar';
import starUrl from '../assets/icons/star.svg';
import {
    loadProgress,
    getSelectedDifficulty,
    setSelectedDifficulty,
    setCurrentLevel,
    getSeedForDifficulty,
    setSeedForDifficulty,
    setLevelCompleted,
    addEndlessCompleted,
} from '../lib/persistence';
import { emitEvent } from '../lib/events';
import { getDailySeed } from '../lib/daily';
import { setDailyCompleted } from '../lib/persistence';

import type { ReactElement } from 'react';

type Props = {
    playMode?: PlayMode;
    initialSeed?: string | undefined;
    initialDifficulty?: GameState['difficulty'];
    onExit?: () => void;
};

export default function GameShell({ playMode = 'journey', initialSeed, initialDifficulty, onExit }: Props): ReactElement {
    const [state, setState] = useState<GameState | null>(null);
    const progress = loadProgress();
    const persistedDifficulty = getSelectedDifficulty();
    // Palette selection removed — use single canonical palette id 0
    const paletteId = 0;
    const [seed, setSeed] = useState<string>(() => {
        if (playMode === 'daily') return getDailySeed();
        try {
            if (initialSeed) return initialSeed;
            const s = getSeedForDifficulty(persistedDifficulty as string);
            if (s) return s;
        } catch { }
        return `seed-${Date.now()}`;
    });
    const [difficulty, setDifficulty] = useState<GameState['difficulty']>(
        playMode === 'daily'
            ? 'hard'
            : ((initialDifficulty as GameState['difficulty']) || (persistedDifficulty as GameState['difficulty']))
    );
    const initialLevel = progress.difficulties?.[difficulty]?.currentLevel ?? 1;
    const [currentLevel, setCurrentLevelState] = useState<number>(initialLevel);
    const [showDebug, setShowDebug] = useState<boolean>(false);
    const [forceHidden, setForceHidden] = useState<boolean>(false);

    useEffect(() => {
        const { state: s } = createLevel({ difficulty, level: currentLevel, seed, hiddenNuts: forceHidden ? true : null });
        setLevelSolvable(typeof s.optimalMoves === 'number' && s.optimalMoves > 0);
        try {
            setSeedForDifficulty(difficulty, seed);
        } catch { }
        setState(s);
    }, [seed, difficulty, currentLevel, forceHidden]);

    const [selected, setSelected] = useState<string | null>(null);
    const [invalidTarget, setInvalidTarget] = useState<string | null>(null);
    const lastClickRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });
    const [animMove, setAnimMove] = useState<AnimMove | null>(null);
    const [hintPreview, setHintPreview] = useState<HintPreview | null>(null);
    const [showComplete, setShowComplete] = useState(false);
    const [levelSolvable, setLevelSolvable] = useState(true);

    const handleAnimDone = useCallback(() => {
        setAnimMove(null);
    }, []);

    useEffect(() => {
        if (!state) return;
        if (isWin(state)) setShowComplete(true);
        else setShowComplete(false);
        if (isWin(state)) {
            try { emitEvent('win', { level: state.level }); } catch { }
        }
    }, [state]);

    const computeSortedPercent = (s: GameState) => {
        const bolts = s.bolts || [];
        const total = bolts.reduce((acc, b) => acc + (b.nuts?.length || 0), 0);
        if (total === 0) return 100;
        let sorted = 0;
        for (const b of bolts) {
            if (!b.nuts || b.nuts.length === 0) continue;
            const first = b.nuts[0];
            const getNutColor = (n: unknown) => (typeof n === 'string' ? n : (n as { color?: string } | undefined)?.color);
            const firstColor = getNutColor(first);
            const uniform = b.nuts.every((n) => {
                const col = getNutColor(n);
                return col === firstColor;
            });
            if (uniform) sorted += b.nuts.length;
        }
        return Math.round((sorted / total) * 100);
    };

    const pct = state ? computeSortedPercent(state) : 0;
    const progressFillRef = useRef<HTMLDivElement | null>(null);
    const prevPctRef = useRef<number>(pct);
    const [bump, setBump] = useState(false);
    useEffect(() => {
        if (pct > prevPctRef.current) {
            setBump(true);
            const t = setTimeout(() => setBump(false), 360);
            return () => clearTimeout(t);
        }
        prevPctRef.current = pct;
    }, [pct]);

    useEffect(() => {
        if (!progressFillRef.current) return;
        progressFillRef.current.style.width = `${pct}%`;
    }, [pct]);

    if (!state) return <div className="game-loading">Loading...</div>;

    const handleUndo = () => {
        const res = undoLastMove(state);
        if (res.success) setState({ ...state });
    };

    const handleRestart = () => {
        const { state: s } = createLevel({
            difficulty,
            level: currentLevel,
            seed,
            hiddenNuts: forceHidden ? true : null,
            skipSolvabilityCheck: true,
        });
        setState(s);
        setSelected(null);
        setInvalidTarget(null);
        setAnimMove(null);
        setHintPreview(null);
        setShowComplete(false);
    };

    const handleBoltClick = (id: string) => {
        const now = Date.now();
        const THROTTLE_MS = 120;
        if (lastClickRef.current.id === id && now - lastClickRef.current.time < THROTTLE_MS) {
            return;
        }
        lastClickRef.current = { id, time: now };
        if (!selected) {
            const b = state.bolts.find((x) => x.id === id);
            if (b && b.nuts.length > 0) {
                try {
                    const top = b.nuts[b.nuts.length - 1];
                    const color = typeof top === 'string' ? top : (top as any).color;
                    emitEvent('pick', { color, count: b.nuts.length });
                } catch { }
                setSelected(id);
                return;
            }
        }

        if (!selected) return;

        const srcBefore = state.bolts.find((b) => b.id === selected);
        const tgtBefore = state.bolts.find((b) => b.id === id);
        const movableBefore = srcBefore && tgtBefore ? getMovableTopCount(srcBefore, tgtBefore) : { count: 0 };
        const preRects = movableBefore.count > 0
            ? Array.from({ length: movableBefore.count }, (_, offset) => {
                const slotIndex = (srcBefore?.nuts.length || 0) - movableBefore.count + offset;
                const selector = `[data-bolt="${selected}"] [data-nut-index="${slotIndex}"] [data-preview-fill]`;
                const sourceEl = document.querySelector(selector) as SVGGraphicsElement | null;
                if (!sourceEl) return null;
                const rect = sourceEl.getBoundingClientRect();
                return {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    color: sourceEl.getAttribute('data-preview-fill') || '#bdbdbd',
                };
            }).filter(Boolean) as Array<{ left: number; top: number; width: number; height: number; color: string }>
            : [];

        const res = executeMoveOnState(state, selected, id);
        setSelected(null);
        if (res.success) {
            setState({ ...state });
            if (res.move) {
                setAnimMove({ move: res.move, preRects });
            }
            try { emitEvent('move', res.move); } catch { }
        } else {
            setInvalidTarget(id);
            setTimeout(() => setInvalidTarget(null), 420);
        }
    };

    // Extra bolt feature removed — no-op placeholder kept for compatibility if referenced
    // function handleAddExtraBolt() { }

    const findHint = (): HintPreview | null => {
        const solution = computeSolutionPath(state, { maxDepth: 140, maxStates: 250000 });
        if (solution && solution.length > 0) {
            return { fromBoltId: solution[0].fromBoltId, toBoltId: solution[0].toBoltId, count: solution[0].count, allowed: true };
        }

        for (const src of state.bolts) {
            for (const tgt of state.bolts) {
                if (tgt.id === src.id) continue;
                const movable = getMovableTopCount(src, tgt);
                if (movable.count > 0) return { fromBoltId: src.id, toBoltId: tgt.id, count: movable.count, allowed: true };
            }
        }
        return null;
    };

    const handleHint = () => {
        const h = findHint();
        if (!h) return;
        setSelected(null);
        setInvalidTarget(null);
        setHintPreview({ ...h });
    };

    const handleContinue = () => {
        if (playMode === 'endless') {
            try {
                addEndlessCompleted(difficulty);
            } catch { }
            const newSeed = `seed-${Date.now()}`;
            setSeed(newSeed);
            setShowComplete(false);
            return;
        }

        if (playMode === 'daily') {
            try {
                const ds = getDailySeed();
                // ds like daily-v1-YYYY-MM-DD -> store date only
                const dateStr = ds.slice('daily-v1-'.length);
                setDailyCompleted(dateStr);
            } catch { }
            onExit?.();
            return;
        }

        if (playMode === 'journey') {
            try {
                setLevelCompleted(difficulty, state.level);
            } catch { }
            // return to Journey selector
            onExit?.();
            return;
        }

        const nextLevel = (currentLevel || 1) + 1;
        setCurrentLevel(difficulty, nextLevel);
        setCurrentLevelState(nextLevel);
        const newSeed = `seed-${Date.now()}`;
        setSeed(newSeed);
        try {
            setSeedForDifficulty(difficulty, newSeed);
        } catch { }
        setShowComplete(false);
    };

    return (
        <div className="game-shell-root">
            <div className="game-shell-header">
                <TopBar
                    level={state.level}
                    difficulty={difficulty}
                    seed={seed}
                    playMode={playMode}
                    showSeed={playMode === 'custom'}
                    showDebug={showDebug}
                    onShowDebugChange={setShowDebug}
                    forceHidden={forceHidden}
                    onForceHiddenChange={(v) => setForceHidden(v)}
                    onSeedChange={(s) => {
                        setSeed(s);
                        try {
                            setSeedForDifficulty(difficulty, s);
                        } catch { }
                    }}
                />
            </div>

            <div className="board-stage">
                <Board
                    state={state}
                    paletteId={paletteId}
                    showDebug={showDebug}
                    selectedBoltId={selected}
                    invalidBoltId={invalidTarget}
                    onBoltClick={handleBoltClick}
                    animMove={animMove}
                    onAnimDone={handleAnimDone}
                    hintPreview={hintPreview}
                    onHintDone={() => setHintPreview(null)}
                />
            </div>

            <div className="sorted-progress-wrapper">
                <div className="sorted-progress">
                    <div className="progress-bar" aria-hidden>
                        <div ref={progressFillRef} className="progress-fill" />
                    </div>
                    <div className={`progress-label ${bump ? 'bump' : ''}`}>Sorted: {pct}%</div>
                    <div className="visually-hidden" aria-live="polite">Sorted {pct} percent</div>
                </div>
            </div>

            <div className="game-actions">
                <BottomBar
                    onUndo={handleUndo}
                    onHint={handleHint}
                    onRestart={handleRestart}
                    onBack={onExit}
                    undoDisabled={!state.moveHistory || state.moveHistory.length === 0}
                    hintDisabled={!levelSolvable}
                />
            </div>
            {showComplete && (
                <div className="complete-overlay" role="dialog" aria-modal="true">
                    <div className="complete-modal">
                        <div className="hardware-stars">
                            <div className="nut-hex small" aria-hidden>
                                <img src={starUrl} alt="star" className="star-img small" />
                            </div>
                            <div className="nut-hex big" aria-hidden>
                                <div className="star-holder">
                                    <img src={starUrl} alt="star" className="star-img big" />
                                </div>
                            </div>
                            <div className="nut-hex small" aria-hidden>
                                <img src={starUrl} alt="star" className="star-img small" />
                            </div>
                        </div>

                        <h2 className="complete-title">Excellent Sort!</h2>
                        <p className="complete-sub">Nice work — you completed level {state.level}.</p>

                        {(() => {
                            const s = computeStars(state);
                            return (
                                <>
                                    <div className="stats-card">
                                        <div className="stat">
                                            <div className="label">Moves</div>
                                            <div className="value">
                                                {s.moveCount}
                                                {s.optimal ? ` (max: ${s.optimal})` : ''}
                                            </div>
                                        </div>
                                        <div className="divider-vertical" />
                                        <div className="stat">
                                            <div className="label">Time</div>
                                            <div className="value">{Math.round(s.timeSpentMs / 1000)}s</div>
                                        </div>
                                        <div className="divider-vertical" />
                                        <div className="stat">
                                            <div className="label">Stars</div>
                                            <div className="value">
                                                {'★'.repeat(s.totalStars)}
                                                {'☆'.repeat(3 - s.totalStars)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="centered-row">
                                        <button className="control-btn" onClick={handleContinue}>
                                            {playMode === 'endless' ? 'Next Puzzle' : 'Next Level'}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
