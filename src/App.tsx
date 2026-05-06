import React, { useEffect, useState } from 'react';
import AppShell from './app/AppShell';
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
            <div className="app-atmosphere" aria-hidden>
                <span className="orb orb-a" />
                <span className="orb orb-b" />
                <span className="orb orb-c" />
            </div>
            <main className="app-main glass-effect metallic-brushed">
                <div className="app-main-inner">
                    <AppShell />
                    {!progressLoaded && <div className="app-progress-loading">Loading progress...</div>}
                </div>
            </main>
        </div>
    );
}
