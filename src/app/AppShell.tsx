import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameShell from './GameShell';
import TutorialShell from './TutorialShell';
import type { Screen } from '../lib/types';

export default function AppShell() {
    const [screen, setScreen] = useState<Screen>({ type: 'home' });

    return (
        <div className="app-shell-root">
            {screen.type === 'home' && (
                <HomeScreen
                    onSelectMode={(mode, opts) => {
                        if (mode === 'tutorial') setScreen({ type: 'tutorial' });
                        else if (mode === 'custom') setScreen({ type: 'game', mode: 'custom', difficulty: opts?.difficulty || 'easy', seed: opts?.seed });
                        else setScreen({ type: 'game', mode, difficulty: opts?.difficulty || 'easy', seed: opts?.seed });
                    }}
                />
            )}

            {screen.type === 'game' && screen.mode === 'tutorial' && (
                <TutorialShell onExit={() => setScreen({ type: 'home' })} />
            )}

            {screen.type === 'game' && screen.mode !== 'tutorial' && (
                <GameShell playMode={screen.mode} initialSeed={screen.seed} initialDifficulty={screen.difficulty} onExit={() => setScreen({ type: 'home' })} />
            )}

            {screen.type === 'tutorial' && <TutorialShell onExit={() => setScreen({ type: 'home' })} />}
        </div>
    );
}
