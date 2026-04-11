import React, { useEffect, useState } from 'react';
import GameShell from './GameShell';
import { setTutorialCompleted } from '../lib/persistence';
import { onEvent, offEvent } from '../lib/events';

type Props = { onExit?: () => void };

export default function TutorialShell({ onExit }: Props) {
    const [step, setStep] = useState(0);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [pendingExitOnWin, setPendingExitOnWin] = useState(false);
    const steps = [
        'Welcome — Tap a bolt to pick up matching colored nuts.',
        'Pick — Tap the highlighted bolt to lift the group.',
        'Place — Tap the target bolt to place the group.',
        'Extra Bolt — Use Extra Bolt to free space if needed.',
        'Win — Arrange so each bolt contains one color to win.',
    ];

    useEffect(() => {
        // subscribe to engine events to auto-advance tutorial
        const unsubPick = onEvent('pick', () => {
            setStep((s) => Math.min(s + 1, steps.length - 1));
        });
        const unsubMove = onEvent('move', () => {
            setStep((s) => Math.max(s, 3));
        });
        const unsubWin = onEvent('win', () => {
            // if player finished the tutorial and is now winning the level, exit to home
            if (pendingExitOnWin) {
                setTutorialCompleted(true);
                onExit?.();
            } else {
                // if win occurs unexpectedly, mark tutorial completed and exit immediately
                setTutorialCompleted(true);
                onExit?.();
            }
        });

        return () => {
            try { unsubPick(); } catch { }
            try { unsubMove(); } catch { }
            try { unsubWin(); } catch { }
        };
    }, [onExit, pendingExitOnWin]);

    const handleSkip = () => {
        setTutorialCompleted(true);
        onExit?.();
    };

    const handleNext = () => {
        if (step >= steps.length - 1) {
            // finish tutorial: mark completed, close overlay, but allow player to play the level
            setTutorialCompleted(true);
            setPendingExitOnWin(true);
            setOverlayVisible(false);
            return;
        }
        setStep((s) => Math.min(s + 1, steps.length - 1));
    };

    const handleBack = () => setStep((s) => Math.max(0, s - 1));

    return (
        <>
            <GameShell playMode={'tutorial'} initialSeed={undefined} initialDifficulty={'medium'} onExit={onExit} />

            {overlayVisible && (
                <div className="complete-overlay tutorial-overlay" role="dialog" aria-modal="true" aria-label="Tutorial">
                    <div className="complete-modal tutorial-modal">
                        <p style={{ marginBottom: 12 }}>{steps[step]}</p>
                        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                            <button className="control-btn" onClick={handleBack} disabled={step === 0}>Back</button>
                            <button className="control-btn" onClick={handleNext}>{step === steps.length - 1 ? 'Finish' : 'Next'}</button>
                            <button className="control-btn" onClick={() => { setTutorialCompleted(true); setPendingExitOnWin(false); setOverlayVisible(false); onExit?.(); }}>Skip tutorial</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
