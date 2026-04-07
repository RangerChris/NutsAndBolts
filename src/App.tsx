import React, { useEffect, useState } from 'react';
import GameShell from './app/GameShell';
import { initPersistence, setCurrentLevel } from './lib/persistence';
import { onBalancerEvent } from './lib/balancer';

import type { ReactElement } from 'react';

export default function App(): ReactElement {
    const [progressLoaded, setProgressLoaded] = useState(false);

    useEffect(() => {
        const { unsubscribe } = initPersistence();
        setProgressLoaded(true);


        const unsubEvent = onBalancerEvent((ev) => {
            try {
                if (ev.payload && ev.payload.event === 'levelComplete') {
                    const diff = ev.payload.difficulty;
                    const level =
                        typeof ev.payload.level === 'number'
                            ? ev.payload.level
                            : parseInt(ev.payload.level, 10) || 1;
                    setCurrentLevel(diff, level + 1);
                }
            } catch {

            }
        });

        return () => {
            unsubscribe();
            unsubEvent();
        };
    }, []);

    return (
        <div className="app-root hardware-texture">
            <main className="app-main glass-effect metallic-brushed">
                <GameShell />
                {!progressLoaded && <div>Loading progress...</div>}
            </main>
            <footer className="app-footer">
                <div className="container">Version: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}</div>
            </footer>
        </div>
    );
}
