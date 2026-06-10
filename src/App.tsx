import React, { useEffect, useState } from 'react';
import AppShell from './app/AppShell';
import { initPersistence, setCurrentLevel } from './lib/persistence';
import { onBalancerEvent } from './lib/balancer';

import type { ReactElement } from 'react';

function toLevel(raw: unknown): number {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') return parseInt(raw, 10) || 1;
    return 1;
}

export default function App(): ReactElement {
    const [progressLoaded, setProgressLoaded] = useState(false);

    useEffect(() => {
        const { unsubscribe } = initPersistence();
        setProgressLoaded(true);

        const unsubEvent = onBalancerEvent((ev) => {
            try {
                if (ev.payload?.event !== 'levelComplete') return;
                const { difficulty, level: rawLevel } = ev.payload;
                if (typeof difficulty !== 'string') return;
                setCurrentLevel(difficulty, toLevel(rawLevel) + 1);
            } catch {
                // swallow listener errors — persistence writes are best-effort
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
