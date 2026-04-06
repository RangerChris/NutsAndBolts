import React, { useEffect, useState } from 'react';
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
    const [seed, setSeed] = useState<string>(() => `seed-${Date.now()}`);
    const persistedDifficulty = getSelectedDifficulty();
    const [difficulty, setDifficulty] = useState<GameState['difficulty']>(
        persistedDifficulty as GameState['difficulty']
    );
    const initialLevel = progress.difficulties?.[difficulty]?.currentLevel ?? 1;
    const [currentLevel, setCurrentLevelState] = useState<number>(initialLevel);
    const [showDebug, setShowDebug] = useState<boolean>(false);

    useEffect(() => {
        const { state: s } = createLevel({ difficulty, level: currentLevel, seed });
        setState(s);
    }, [seed, difficulty, currentLevel]);

    const [selected, setSelected] = useState<string | null>(null);
    const [invalidTarget, setInvalidTarget] = useState<string | null>(null);
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

    const handleBoltClick = (id: string) => {
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
                    onPaletteChange={(id) => {
                        setPalette(id);
                        setPaletteId(id);
                    }}
                    onSeedChange={(s) => {
                        setSeed(s);
                    }}
                    onDifficultyChange={(d) => {
                        const newDiff = d as GameState['difficulty'];
                        setDifficulty(newDiff);
                        setSelectedDifficulty(newDiff);
                        // switch to stored level for the new difficulty (or 1)
                        const lvl = loadProgress().difficulties?.[newDiff]?.currentLevel ?? 1;
                        setCurrentLevelState(lvl);
                        const newSeed = `seed-${Date.now()}`;
                        setSeed(newSeed);
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
            <div className="game-actions">
                <BottomBar
                    onExtra={handleExtra}
                    onUndo={handleUndo}
                    onHint={handleHint}
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
