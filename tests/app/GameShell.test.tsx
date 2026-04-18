import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import GameShell from '../../src/app/GameShell'

afterEach(() => {
    cleanup()
})

if (typeof document === 'undefined') {
    describe.skip('GameShell UI (skipped - no DOM available)', () => {
        it('skipped', () => { })
    })
} else {
    describe('GameShell UI', () => {
        it('renders with no extra bolt control button', async () => {
            render(<GameShell />)
            expect(screen.queryByText(/Extra Bolt/i)).toBeNull()
        })

        it('undo button is disabled when no history and exists', async () => {
            render(<GameShell />)
            const undoBtns = await screen.findAllByText(/Undo/i)
            expect(undoBtns.length).toBeGreaterThan(0)
            expect(undoBtns[0].hasAttribute('disabled')).toBe(true)
        })
    })
}
