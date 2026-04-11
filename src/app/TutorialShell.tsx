import React, { useEffect, useState } from 'react';
import GameShell from './GameShell';
import { setTutorialCompleted } from '../lib/persistence';
import { onEvent, offEvent } from '../lib/events';

type Props = { onExit?: () => void };

export default function TutorialShell({ onExit }: Props) {
    const [step, setStep] = useState(0);
    const steps = [
        'Welcome — Tap a bolt to pick up matching colored nuts.',
        'Pick — Tap the highlighted bolt to lift the group.',
        'Place — Tap the target bolt to place the group.',
        'Extra Bolt — Use Extra Bolt to free space if needed.',
        'Win — Arrange so each bolt contains one color to win.',
    ];

    useEffect(() => {
        // subscribe to engine events to auto-advance tutorial
        const unsubPick = onEvent('pick', (p) => {
            if (step === 0) setStep(1);
            else if (step === 1) setStep(2);
        });
        const unsubMove = onEvent('move', (m) => {
            if (step <= 2) setStep(3);
        });
        const unsubWin = onEvent('win', () => {
            setTutorialCompleted(true);
            onExit?.();
        });

        return () => {
            try { unsubPick(); } catch { }
            try { unsubMove(); } catch { }
            try { unsubWin(); } catch { }
        };
    }, [step, onExit]);

    const handleSkip = () => {
        setTutorialCompleted(true);
        onExit?.();
    };

    return (
        <div className="tutorial-shell">
            <GameShell playMode={'tutorial'} initialSeed={undefined} initialDifficulty={'easy'} onExit={onExit} />
            <div className="tutorial-overlay" role="region" aria-live="polite">
                <div className="tutorial-banner">
                    <p>{steps[step]}</p>
                    <div className="tutorial-actions">
                        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
                        <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>Next</button>
                        <button onClick={handleSkip}>Skip tutorial</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
