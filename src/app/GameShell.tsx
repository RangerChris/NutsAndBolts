import React, { useEffect, useState } from 'react';
import type { GameState, Bolt } from '../lib/types';
import { createLevel } from '../lib/generator';
import { addExtraBolt, undoLastMove, isWin, executeMoveOnState, pickTopGroup, canPlaceGroup, computeStars } from '../lib/engine';
import Board from '../components/Board';
import BottomBar from '../components/BottomBar';
import TopBar from '../components/TopBar';
import { loadProgress, setPaletteId, getSelectedDifficulty, setSelectedDifficulty, setCurrentLevel } from '../lib/persistence';
import { getPalette } from '../lib/palettes';

export default function GameShell(): JSX.Element {
    const [state, setState] = useState<GameState | null>(null);
    const progress = loadProgress();
    const [paletteId, setPalette] = useState<number>(progress.settings?.paletteId ?? 0);
    const [seed, setSeed] = useState<string>(() => `seed-${Date.now()}`);
    const persistedDifficulty = getSelectedDifficulty();
    const [difficulty, setDifficulty] = useState<GameState['difficulty']>(persistedDifficulty as GameState['difficulty']);
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
    const [animMove, setAnimMove] = useState<any | null>(null);
    const [showComplete, setShowComplete] = useState(false);

    const handleAnimDone = () => {
        setAnimMove(null);
    };

    useEffect(() => {
        if (!state) return;
        if (isWin(state)) setShowComplete(true);
        else setShowComplete(false);
    }, [state]);

    if (!state) return <div style={{ padding: 16 }}>Loading...</div>;

    const handleExtra = () => {
        const res = addExtraBolt(state);
        if (res.success) setState({ ...state });
        else {
            // show invalid feedback on target
            setInvalidTarget(id);
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
        const preRects: Array<{ left: number; top: number; width: number; height: number; color: string }> = [];
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
                } catch (e) {
                    // ignore
                }
                preRects.push({ left: r.left, top: r.top, width: r.width, height: r.height, color, colorLabel });
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
        <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
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

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
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
                <div style={{ marginLeft: 12 }}>
                    {isWin(state) ? <span>🎉 Solved</span> : <span>In play</span>}
                </div>
            </div>

            <div>
                <strong>Bolts</strong> ({state.bolts.length}):
                <Board state={state} paletteId={paletteId} showDebug={showDebug} selectedBoltId={selected} invalidBoltId={invalidTarget} onBoltClick={handleBoltClick} animMove={animMove} onAnimDone={handleAnimDone} />
            </div>
            {showComplete && (
                <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                        <h2>Level Complete</h2>
                        <p>Nice work — you completed level {state.level}.</p>
                        <div style={{ marginTop: 8 }}>
                            {/* move and star summary */}
                            {(() => {
                                const s = computeStars(state);
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div><strong>Moves:</strong> {s.moveCount}{s.optimal ? ` (optimal ${s.optimal})` : ''}</div>
                                        <div><strong>Time:</strong> {Math.round(s.timeSpentMs / 1000)}s used of {Math.round(s.timeAvailableMs / 1000)}s available</div>
                                        <div><strong>Stars:</strong> {'★'.repeat(s.totalStars)}{'☆'.repeat(3 - s.totalStars)}</div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                            <button onClick={handleContinue} style={{ fontWeight: '600' }}>Continue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
