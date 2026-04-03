import React from 'react'
import GameShell from './app/GameShell'

export default function App(): JSX.Element {
    return (
        <div className="app-root">
            <header className="topbar">
                <h1>Nuts & Bolts</h1>
            </header>
            <main>
                <GameShell />
            </main>
        </div>
    )
}
