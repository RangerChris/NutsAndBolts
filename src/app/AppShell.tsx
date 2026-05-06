import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameShell from './GameShell';
import TutorialShell from './TutorialShell';
import JourneyScreen from './JourneyScreen';
import type { Screen } from '../lib/types';

export default function AppShell() {
    const getInitialScreen = (): Screen => {
        try {
            const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            if (params) {
                const mode = params.get('mode');
                if (mode === 'tutorial') return { type: 'tutorial' };
                if (mode === 'custom') {
                    const difficulty = (params.get('difficulty') as any) || 'easy';
                    const seed = params.get('seed') || undefined;
                    return { type: 'game', mode: 'custom', difficulty, seed };
                }
                if (mode === 'journey') return { type: 'difficulty-select', mode: 'journey' };
            }
        } catch { }
        return { type: 'home' };
    };

    const [screen, setScreen] = useState<Screen>(getInitialScreen);
    const shellScreenClass =
        screen.type === 'game'
            ? `screen-${screen.type} mode-${screen.mode}`
            : `screen-${screen.type}`;

    return (
        <div className={`app-shell-root ${shellScreenClass}`}>
            {screen.type === 'home' && (
                <HomeScreen
                    onSelectMode={(mode, opts) => {
                        if (mode === 'tutorial') setScreen({ type: 'tutorial' });
                        else if (mode === 'journey') setScreen({ type: 'difficulty-select', mode: 'journey' });
                        else if (mode === 'custom') setScreen({ type: 'game', mode: 'custom', difficulty: opts?.difficulty || 'easy', seed: opts?.seed });
                        else setScreen({ type: 'game', mode, difficulty: opts?.difficulty || 'easy', seed: opts?.seed });
                    }}
                />
            )}

            {screen.type === 'game' && screen.mode === 'tutorial' && (
                <TutorialShell onExit={() => setScreen({ type: 'home' })} />
            )}

            {screen.type === 'game' && screen.mode !== 'tutorial' && (
                <GameShell
                    playMode={screen.mode}
                    initialSeed={screen.seed}
                    initialDifficulty={screen.difficulty}
                    onExit={() => {
                        // return to journey level picker when playing a journey-level
                        if (screen.mode === 'journey') setScreen({ type: 'difficulty-select', mode: 'journey' });
                        else setScreen({ type: 'home' });
                    }}
                />
            )}

            {screen.type === 'tutorial' && <TutorialShell onExit={() => setScreen({ type: 'home' })} />}

            {screen.type === 'difficulty-select' && screen.mode === 'journey' && (
                <JourneyScreen
                    onPlayLevel={(difficulty, level, seed) => setScreen({ type: 'game', mode: 'journey', difficulty, seed })}
                    onBack={() => setScreen({ type: 'home' })}
                />
            )}
        </div>
    );
}
