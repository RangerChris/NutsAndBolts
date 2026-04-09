import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GameShell from './GameShell'

if (typeof document === 'undefined') {
    describe.skip('GameShell UI (skipped - no DOM available)', () => {
        it('skipped', () => { })
    })
} else {
    describe('GameShell UI', () => {
        it('renders with no extra bolt control button', async () => {
            render(<GameShell />)
            expect(screen.queryByText(/Extra Bolt/i)).not.toBeInTheDocument()
        })

        it('undo button is disabled when no history and exists', async () => {
            render(<GameShell />)
            const undoBtn = await screen.findByText(/Undo/i)
            expect(undoBtn).toBeInTheDocument()
            expect(undoBtn).toBeDisabled()
        })
    })
}
