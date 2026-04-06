import React, { useEffect, useState } from 'react';
import GameShell from './app/GameShell';
import { initPersistence, setCurrentLevel } from './lib/persistence';
import { onBalancerEvent } from './lib/balancer';

import type { ReactElement } from 'react';

export default function App(): ReactElement {
    const [progressLoaded, setProgressLoaded] = useState(false);

    useEffect(() => {
        const { unsubscribe } = initPersistence();
        // keep progress if needed — for now we just mark loaded
        setProgressLoaded(true);

        // Listen for level completion events and persist progress
        const unsubEvent = onBalancerEvent((ev) => {
            try {
                if (ev.payload && ev.payload.event === 'levelComplete') {
                    const diff = ev.payload.difficulty;
                    const level =
                        typeof ev.payload.level === 'number'
                            ? ev.payload.level
                            : parseInt(ev.payload.level, 10) || 1;
                    // advance to next level
                    setCurrentLevel(diff, level + 1);
                }
            } catch {
                // ignore
            }
        });

        return () => {
            unsubscribe();
            unsubEvent();
        };
    }, []);

    return (
        <div className="app-root hardware-texture">
            <header className="topbar glass-effect metallic-brushed topbar-header-padding">
                <h1 className="topbar-title">Nuts & Bolts</h1>
            </header>
            <main className="app-main glass-effect metallic-brushed">
                <GameShell />
                {!progressLoaded && <div>Loading progress...</div>}
            </main>
        </div>
    );
}
