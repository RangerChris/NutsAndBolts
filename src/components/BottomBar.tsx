import React from 'react';

type Props = {
    onUndo: () => void;
    onHint: () => void;
    onRestart?: () => void;
    undoDisabled?: boolean;
    hintDisabled?: boolean;
    version?: string;
};

export default function BottomBar({ onUndo, onHint, onRestart, undoDisabled, hintDisabled, version }: Props) {
    return (
        <div className="bottom-bar bottom-bar-inner">
            <button className="control-btn undo" onClick={onUndo} disabled={Boolean(undoDisabled)}>Undo</button>
            <button className="control-btn hint" onClick={onHint} disabled={Boolean(hintDisabled)}>Hint</button>
            <button className="control-btn restart" onClick={onRestart} aria-label="Restart level">Restart</button>
            <span className="bottom-bar-version" aria-label="App version">Version: {version || '0.0.0'}</span>
        </div>
    );
}
