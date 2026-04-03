import React, { useEffect, useState } from 'react'
import GameShell from './app/GameShell'
import { initPersistence, setCurrentLevel } from './lib/persistence'
import { onBalancerEvent } from './lib/balancer'

export default function App(): JSX.Element {
    const [progressLoaded, setProgressLoaded] = useState(false)

    useEffect(() => {
        const { progress, unsubscribe } = initPersistence()
        // keep progress if needed — for now we just mark loaded
        setProgressLoaded(true)

        // Listen for level completion events and persist progress
        const unsubEvent = onBalancerEvent((ev) => {
            try {
                if (ev.payload && ev.payload.event === 'levelComplete') {
                    const diff = ev.payload.difficulty;
                    const level = typeof ev.payload.level === 'number' ? ev.payload.level : parseInt(ev.payload.level, 10) || 1
                    // advance to next level
                    setCurrentLevel(diff, level + 1)
                }
            } catch (e) {
                // ignore
            }
        })

        return () => {
            unsubscribe()
            unsubEvent()
        }
    }, [])

    return (
        <div className="app-root">
            <header className="topbar">
                <h1>Nuts & Bolts</h1>
            </header>
            <main>
                <GameShell />
                {!progressLoaded && <div>Loading progress...</div>}
            </main>
        </div>
    )
}
