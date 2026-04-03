import React, { useEffect, useState } from 'react';
import type { GameState, Bolt } from '../lib/types';
import { createLevel } from '../lib/generator';
import { addExtraBolt, undoLastMove, isWin, executeMoveOnState, pickTopGroup, canPlaceGroup } from '../lib/engine';
import Board from '../components/Board';
import BottomBar from '../components/BottomBar';
import TopBar from '../components/TopBar';
import { loadProgress, setPaletteId } from '../lib/persistence';
import { getPalette } from '../lib/palettes';

export default function GameShell(): JSX.Element {
    const [state, setState] = useState<GameState | null>(null);
    const progress = loadProgress();
    const [paletteId, setPalette] = useState<number>(progress.settings?.paletteId ?? 0);
    const [seed, setSeed] = useState<string>('ui-1');

    useEffect(() => {
        const { state: s } = createLevel({ difficulty: 'easy', level: 1, seed: 'ui-1' });
        setState(s);
    }, []);

    const [selected, setSelected] = useState<string | null>(null);
    const [invalidTarget, setInvalidTarget] = useState<string | null>(null);
    // Animation state for FLIP clone animations — keep hooks unconditional
    const [animMove, setAnimMove] = useState<any | null>(null);

    const handleAnimDone = () => {
        setAnimMove(null);
    };

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
                try {
                    const poly = sel.querySelector('polygon');
                    if (poly) color = (poly as SVGElement).getAttribute('fill') || color;
                } catch (e) {
                    // ignore
                }
                preRects.push({ left: r.left, top: r.top, width: r.width, height: r.height, color });
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

    return (
        <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
                <strong>Level</strong>: {state.level} — <strong>Difficulty</strong>: {state.difficulty}
                <div style={{ marginTop: 8 }}>
                    <TopBar level={state.level} difficulty={state.difficulty} seed={seed} paletteId={paletteId} onPaletteChange={(id) => { setPalette(id); setPaletteId(id); }} onSeedChange={(s) => { setSeed(s); const { state: sst } = createLevel({ difficulty: 'easy', level: state.level, seed: s }); setState(sst); }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                    <BottomBar
                        onExtra={handleExtra}
                        onUndo={handleUndo}
                        onHint={handleHint}
                        extraDisabled={state.extraBoltUsed || state.bolts.length >= 12}
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
                <Board state={state} paletteId={paletteId} selectedBoltId={selected} invalidBoltId={invalidTarget} onBoltClick={handleBoltClick} animMove={animMove} onAnimDone={handleAnimDone} />
            </div>
        </div>
    );
}
