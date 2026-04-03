import React from 'react';

type Props = {
    onExtra: () => void;
    onUndo: () => void;
    onHint: () => void;
    extraDisabled?: boolean;
    undoDisabled?: boolean;
    hintDisabled?: boolean;
};

export default function BottomBar({ onExtra, onUndo, onHint, extraDisabled, undoDisabled, hintDisabled }: Props) {
    return (
        <div className="bottom-bar" style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
            <button onClick={onExtra} disabled={Boolean(extraDisabled)} aria-disabled={Boolean(extraDisabled)}>Extra Bolt</button>
            <button onClick={onUndo} disabled={Boolean(undoDisabled)} aria-disabled={Boolean(undoDisabled)}>Undo</button>
            <button onClick={onHint} disabled={Boolean(hintDisabled)} aria-disabled={Boolean(hintDisabled)}>Hint</button>
        </div>
    );
}
