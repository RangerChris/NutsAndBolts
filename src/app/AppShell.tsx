import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameShell from './GameShell';
import JourneyScreen from './JourneyScreen';
import type { Difficulty, Screen } from '../lib/types';

function getInitialScreen(): Screen {
    if (typeof window === 'undefined') return { type: 'home' };
    try {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode === 'custom') {
            const raw = params.get('difficulty') as Difficulty | null;
            const difficulty: Difficulty = raw === 'medium' || raw === 'hard' || raw === 'extreme' ? raw : 'easy';
            return { type: 'game', mode: 'custom', difficulty, seed: params.get('seed') || undefined };
        }
        if (mode === 'journey') return { type: 'difficulty-select', mode: 'journey' };
    } catch {
        // fall through to home
    }
    return { type: 'home' };
}

export default function AppShell() {
    const [screen, setScreen] = useState<Screen>(getInitialScreen);

    const shellScreenClass =
        screen.type === 'game' ? `screen-${screen.type} mode-${screen.mode}` : `screen-${screen.type}`;

    const handleSelectMode = (mode: 'journey' | 'custom' | 'daily' | 'endless', opts?: { difficulty?: Difficulty; seed?: string }) => {
        if (mode === 'journey') setScreen({ type: 'difficulty-select', mode: 'journey' });
        else setScreen({ type: 'game', mode, difficulty: opts?.difficulty || 'easy', seed: opts?.seed });
    };

    return (
        <div className={`app-shell-root ${shellScreenClass}`}>
            {screen.type === 'home' && <HomeScreen onSelectMode={handleSelectMode} />}

            {screen.type === 'game' && (
                <GameShell
                    playMode={screen.mode}
                    initialSeed={screen.seed}
                    initialDifficulty={screen.difficulty}
                    onExit={() =>
                        // return to journey level picker when playing a journey-level
                        setScreen(screen.mode === 'journey' ? { type: 'difficulty-select', mode: 'journey' } : { type: 'home' })
                    }
                />
            )}

            {screen.type === 'difficulty-select' && screen.mode === 'journey' && (
                <JourneyScreen
                    onPlayLevel={(difficulty, _level, seed) => setScreen({ type: 'game', mode: 'journey', difficulty, seed })}
                    onBack={() => setScreen({ type: 'home' })}
                />
            )}
        </div>
    );
}
