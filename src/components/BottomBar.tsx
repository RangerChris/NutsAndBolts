import React from 'react';

type Props = {
    onUndo: () => void;
    onHint: () => void;
    onRestart?: () => void;
    onBack?: () => void;
    undoDisabled?: boolean;
    hintDisabled?: boolean;
};

export default function BottomBar({ onUndo, onHint, onRestart, onBack, undoDisabled, hintDisabled }: Props) {
    return (
        <div className="bottom-bar bottom-bar-inner" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
            <div className="centered-controls">
                {onBack && (
                    <button className="control-btn back" onClick={onBack} aria-label="Back to menu">Back</button>
                )}
                <button className="control-btn undo" onClick={onUndo} disabled={Boolean(undoDisabled)}>Undo</button>
                <button className="control-btn hint" onClick={onHint} disabled={Boolean(hintDisabled)}>Hint</button>
                <button className="control-btn restart" onClick={onRestart} aria-label="Restart level">Restart</button>
            </div>
        </div>
    );
}
