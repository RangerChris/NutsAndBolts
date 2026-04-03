import React, { useEffect, useState } from 'react';
import type { GameState, Bolt } from '../lib/types';
import { createLevel } from '../lib/generator';
import { addExtraBolt, undoLastMove, isWin } from '../lib/engine';

export default function GameShell(): JSX.Element {
    const [state, setState] = useState<GameState | null>(null);

    useEffect(() => {
        const { state: s } = createLevel({ difficulty: 'easy', level: 1, seed: 'ui-1' });
        setState(s);
    }, []);

    if (!state) return <div style={{ padding: 16 }}>Loading...</div>;

    const handleExtra = () => {
        const res = addExtraBolt(state);
        if (res.success) setState({ ...state });
    };

    const handleUndo = () => {
        const res = undoLastMove(state);
        if (res.success) setState({ ...state });
    };

    return (
        <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
                <strong>Level</strong>: {state.level} — <strong>Difficulty</strong>: {state.difficulty}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={handleExtra} disabled={state.extraBoltUsed || state.bolts.length >= 12}>
                    Extra Bolt
                </button>
                <button onClick={handleUndo} disabled={!state.moveHistory || state.moveHistory.length === 0}>
                    Undo
                </button>
                <div style={{ marginLeft: 12 }}>
                    {isWin(state) ? <span>🎉 Solved</span> : <span>In play</span>}
                </div>
            </div>

            <div>
                <strong>Bolts</strong> ({state.bolts.length}):
                <ul>
                    {state.bolts.map((b: Bolt) => (
                        <li key={b.id}>{b.id}: [{b.nuts.join(', ')}]</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
