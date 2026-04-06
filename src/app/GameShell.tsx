import React, { useEffect, useState, useRef } from 'react';
import type { GameState } from '../lib/types';
import { createLevel } from '../lib/generator';
import {
    addExtraBolt,
    undoLastMove,
    isWin,
    executeMoveOnState,
    pickTopGroup,
    canPlaceGroup,
    computeStars,
} from '../lib/engine';
import Board, { AnimMove } from '../components/Board';
import BottomBar from '../components/BottomBar';
import TopBar from '../components/TopBar';
import starUrl from '../assets/icons/star.svg'; // Keep star asset
import {
    loadProgress,
    setPaletteId,
    getSelectedDifficulty,
    setSelectedDifficulty,
    setCurrentLevel,
} from '../lib/persistence';

import type { ReactElement } from 'react';

export default function GameShell(): ReactElement {
    const [state, setState] = useState<GameState | null>(null);
    const progress = loadProgress();
    const [paletteId, setPalette] = useState<number>(progress.settings?.paletteId ?? 0);
    const [seed, setSeed] = useState<string>(() => {
        // prefer persisted seed for the selected difficulty so reloads restore the same level
        try {
            const s = require('../lib/persistence').getSeedForDifficulty(persistedDifficulty as string);
            if (s) return s;
        } catch {
            // ignore
        }
        return `seed-${Date.now()}`;
    });
    const persistedDifficulty = getSelectedDifficulty();
    const [difficulty, setDifficulty] = useState<GameState['difficulty']>(
        persistedDifficulty as GameState['difficulty']
    );
    const initialLevel = progress.difficulties?.[difficulty]?.currentLevel ?? 1;
    const [currentLevel, setCurrentLevelState] = useState<number>(initialLevel);
    const [showDebug, setShowDebug] = useState<boolean>(false);
    const [forceHidden, setForceHidden] = useState<boolean>(false);

    useEffect(() => {
        const { state: s } = createLevel({ difficulty, level: currentLevel, seed, hiddenNuts: forceHidden ? true : null });
        // ensure seed is persisted for this difficulty so reloads will recreate same level
        try {
            const { setSeedForDifficulty } = require('../lib/persistence');
            setSeedForDifficulty(difficulty, seed);
        } catch {
            // ignore in non-browser/tests
        }
        setState(s);
    }, [seed, difficulty, currentLevel, forceHidden]);

    const [selected, setSelected] = useState<string | null>(null);
    const [invalidTarget, setInvalidTarget] = useState<string | null>(null);
    // Prevent accidental immediate double-taps on the same bolt
    const lastClickRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });
    // Animation state for FLIP clone animations — keep hooks unconditional
    const [animMove, setAnimMove] = useState<AnimMove | null>(null);
    const [showComplete, setShowComplete] = useState(false);

    const handleAnimDone = () => {
        setAnimMove(null);
    };

    useEffect(() => {
        if (!state) return;
        if (isWin(state)) setShowComplete(true);
        else setShowComplete(false);
    }, [state]);

    const computeSortedPercent = (s: GameState) => {
        const bolts = s.bolts || [];
        const total = bolts.reduce((acc, b) => acc + (b.nuts?.length || 0), 0);
        if (total === 0) return 100;
        let sorted = 0;
        for (const b of bolts) {
            if (!b.nuts || b.nuts.length === 0) continue;
            const first = b.nuts[0];
            const firstColor = typeof first === 'string' ? first : (first as any).color;
            const uniform = b.nuts.every((n) => {
                const col = typeof n === 'string' ? n : (n as any).color;
                return col === firstColor;
            });
            if (uniform) sorted += b.nuts.length;
        }
        return Math.round((sorted / total) * 100);
    };

    // compute pct for render and announce changes
    const pct = state ? computeSortedPercent(state) : 0;
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

    if (!state) return <div className="game-loading">Loading...</div>;

    const handleExtra = () => {
        const res = addExtraBolt(state);
        if (res.success) setState({ ...state });
        else {
            // show invalid feedback on target
            setInvalidTarget('extra');
            setTimeout(() => setInvalidTarget(null), 420);
        }
    };

    const handleUndo = () => {
        const res = undoLastMove(state);
        if (res.success) setState({ ...state });
    };

    const handleRestart = () => {
        // Recreate the level exactly as when first loaded using the same seed
        const { state: s } = createLevel({ difficulty, level: currentLevel, seed, hiddenNuts: forceHidden ? true : null });
        setState(s);
        setSelected(null);
        setInvalidTarget(null);
        setAnimMove(null);
        setShowComplete(false);
    };

    const handleBoltClick = (id: string) => {
        const now = Date.now();
        const THROTTLE_MS = 120; // small window to prevent accidental double taps
        if (lastClickRef.current.id === id && now - lastClickRef.current.time < THROTTLE_MS) {
            return;
        }
        lastClickRef.current = { id, time: now };

        if (!selected) {
            // select source if it has nuts
            const b = state.bolts.find((x) => x.id === id);
            if (b && b.nuts.length > 0) setSelected(id);
            return;
        }
        if (selected === id) {
            setSelected(null);
            return;
        }
        // attempt move
        const srcBolt = state.bolts.find((x) => x.id === selected);
        if (!srcBolt) return;
        const { color, count } = pickTopGroup(srcBolt);
        if (!color || count === 0) {
            setSelected(null);
            return;
        }

        // capture pre-move rects for the top `count` nuts
        const preRects: Array<{
            left: number;
            top: number;
            width: number;
            height: number;
            color: string;
            colorLabel?: string;
        }> = [];
        for (let i = 0; i < count; i++) {
            const idx = srcBolt.nuts.length - count + i;
            const sel = document.querySelector(`[data-bolt="${selected}"] [data-nut-index="${idx}"]`);
            if (sel instanceof Element) {
                const r = sel.getBoundingClientRect();
                // derive color from svg polygon fill if possible
                let color = '#999999';
                let colorLabel: string | undefined = undefined;
                try {
                    // First child rect of the nut <g> is the body with the palette color
                    const nutRect = sel.querySelector('rect');
                    if (nutRect) color = (nutRect as SVGElement).getAttribute('fill') || color;
                    // data-nut-id is on the nut group (and may also exist on descendants)
                    colorLabel = sel.getAttribute('data-nut-id') || undefined;
                    if (!colorLabel) {
                        const labelEl = sel.querySelector('[data-nut-id]');
                        if (labelEl) colorLabel = (labelEl as Element).getAttribute('data-nut-id') || undefined;
                    }
                } catch {
                    // ignore
                }
                preRects.push({
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                    color,
                    colorLabel,
                });
            }
        }

        const res = executeMoveOnState(state, selected, id);
        setSelected(null);
        if (res.success) {
            setState({ ...state });
            // trigger animation in Board using captured rects and the move
            setAnimMove({ move: res.move, preRects });
        } else {
            // show invalid feedback on target
            setInvalidTarget(id);
            setTimeout(() => setInvalidTarget(null), 420);
        }
    };

    const findHint = () => {
        for (const src of state.bolts) {
            const { color, count } = pickTopGroup(src);
            if (!color || count === 0) continue;
            for (const tgt of state.bolts) {
                if (tgt.id === src.id) continue;
                const can = canPlaceGroup(src, tgt, count);
                if (can.ok) return { from: src.id, to: tgt.id };
            }
        }
        return null;
    };

    const handleHint = () => {
        const h = findHint();
        if (!h) return;
        // brief visual cue: select source then clear after short timeout
        setSelected(h.from);
        setTimeout(() => setSelected(null), 800);
    };

    const handleContinue = () => {
        // advance to next level using currentLevel state
        const nextLevel = (currentLevel || 1) + 1;
        // persist current level progress
        setCurrentLevel(difficulty, nextLevel);
        setCurrentLevelState(nextLevel);
        // generate a fresh seed for the next level — effect will create the level
        const newSeed = `seed-${Date.now()}`;
        setSeed(newSeed);
        // persist the new seed for this difficulty so reload will not recreate the old level
        try {
            const { setSeedForDifficulty } = require('../lib/persistence');
            setSeedForDifficulty(difficulty, newSeed);
        } catch {
            // ignore
        }
        setShowComplete(false);
    };

    return (
        <div className="game-shell-root">
            <div className="game-shell-header">
                <TopBar
                    level={state.level}
                    difficulty={difficulty}
                    seed={seed}
                    paletteId={paletteId}
                    showDebug={showDebug}
                    onShowDebugChange={setShowDebug}
                    forceHidden={forceHidden}
                    onForceHiddenChange={(v) => setForceHidden(v)}
                    onPaletteChange={(id) => {
                        setPalette(id);
                        setPaletteId(id);
                    }}
                    onSeedChange={(s) => {
                        setSeed(s);
                        try {
                            const { setSeedForDifficulty } = require('../lib/persistence');
                            setSeedForDifficulty(difficulty, s);
                        } catch {
                            // ignore
                        }
                    }}
                    onDifficultyChange={(d) => {
                        const newDiff = d as GameState['difficulty'];
                        setDifficulty(newDiff);
                        setSelectedDifficulty(newDiff);
                        // switch to stored level for the new difficulty (or 1)
                        const lvl = loadProgress().difficulties?.[newDiff]?.currentLevel ?? 1;
                        setCurrentLevelState(lvl);
                        // load persisted seed for the new difficulty, or create+persist one
                        try {
                            const { getSeedForDifficulty, setSeedForDifficulty } = require('../lib/persistence');
                            const ps = getSeedForDifficulty(newDiff);
                            if (ps) setSeed(ps);
                            else {
                                const gen = `seed-${Date.now()}`;
                                setSeed(gen);
                                setSeedForDifficulty(newDiff, gen);
                            }
                        } catch {
                            const gen = `seed-${Date.now()}`;
                            setSeed(gen);
                        }
                    }}
                />
            </div>

            <div className="game-info-row">
                <div className="game-info-left">
                    {isWin(state) ? <span>🎉 Solved</span> : <span>In play</span>}
                </div>
            </div>

            <div>
                <Board
                    state={state}
                    paletteId={paletteId}
                    showDebug={showDebug}
                    selectedBoltId={selected}
                    invalidBoltId={invalidTarget}
                    onBoltClick={handleBoltClick}
                    animMove={animMove}
                    onAnimDone={handleAnimDone}
                />
            </div>

            <div className="sorted-progress-wrapper">
                <div className="sorted-progress">
                    <div className="progress-bar" aria-hidden>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`progress-label ${bump ? 'bump' : ''}`}>Sorted: {pct}%</div>
                    <div className="visually-hidden" aria-live="polite">Sorted {pct} percent</div>
                </div>
            </div>

            <div className="game-actions">
                <BottomBar
                    onExtra={handleExtra}
                    onUndo={handleUndo}
                    onHint={handleHint}
                    onRestart={handleRestart}
                    // Disable the Extra button when an extra bolt is already present
                    extraDisabled={state.bolts.some((b) => String(b.id).startsWith('extra')) || state.bolts.length >= 12}
                    undoDisabled={!state.moveHistory || state.moveHistory.length === 0}
                    hintDisabled={!!findHint() === false}
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
                                                {s.optimal ? ` (opt ${s.optimal})` : ''}
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
                                            Next Level
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
