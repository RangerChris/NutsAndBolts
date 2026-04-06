import React from 'react';

type Props = {
    onExtra: () => void;
    onUndo: () => void;
    onHint: () => void;
    onRestart?: () => void;
    extraDisabled?: boolean;
    undoDisabled?: boolean;
    hintDisabled?: boolean;
};

export default function BottomBar({ onExtra, onUndo, onHint, onRestart, extraDisabled, undoDisabled, hintDisabled }: Props) {
    return (
        <div className="bottom-bar bottom-bar-inner">
            <button className="control-btn extra" onClick={onExtra} disabled={Boolean(extraDisabled)}>Extra Bolt</button>
            <button className="control-btn undo" onClick={onUndo} disabled={Boolean(undoDisabled)}>Undo</button>
            <button className="control-btn hint" onClick={onHint} disabled={Boolean(hintDisabled)}>Hint</button>
            <button className="control-btn restart" onClick={onRestart} aria-label="Restart level">Restart</button>
        </div>
    );
}
