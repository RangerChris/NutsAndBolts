import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GameShell from './GameShell'

if (typeof document === 'undefined') {
    // Register a skipped suite so Vitest doesn't fail the file
    describe.skip('GameShell UI (skipped - no DOM available)', () => {
        it('skipped', () => { })
    })
} else {
    describe('GameShell UI', () => {
        it('renders and allows extra bolt then prevents second use', async () => {
            render(<GameShell />)
            const extraBtn = await screen.findByText(/Extra Bolt/i)
            expect(extraBtn).toBeInTheDocument()
            // initial state: should be enabled
            expect(extraBtn).not.toBeDisabled()
            fireEvent.click(extraBtn)
            // after click, button should be disabled
            expect(extraBtn).toBeDisabled()
        })

        it('undo button is disabled when no history and exists', async () => {
            render(<GameShell />)
            const undoBtn = await screen.findByText(/Undo/i)
            expect(undoBtn).toBeInTheDocument()
            // initially no moves, so disabled
            expect(undoBtn).toBeDisabled()
        })
    })
}
