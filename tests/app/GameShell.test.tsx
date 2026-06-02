import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import GameShell, { computeSortedPercent } from '../../src/app/GameShell'
import type { GameState } from '../../src/lib/types'

afterEach(() => {
    cleanup()
})

describe('computeSortedPercent', () => {
    const makeState = (bolts: GameState['bolts']): GameState => ({
        bolts,
        extraBoltUsed: false,
        level: 1,
        difficulty: 'easy',
        moveHistory: [],
    })

    it('returns 100 when all nuts are in uniform non-split color bolts', () => {
        const state = makeState([
            {
                id: 'b1',
                capacity: 4,
                nuts: [
                    { id: 'r1', color: 'red' },
                    { id: 'r2', color: 'red' },
                ],
            },
            {
                id: 'b2',
                capacity: 4,
                nuts: [
                    { id: 'g1', color: 'green' },
                    { id: 'g2', color: 'green' },
                ],
            },
        ])

        expect(computeSortedPercent(state)).toBe(100)
    })

    it('returns 99 when all nuts are uniform but a color is split across bolts', () => {
        const state = makeState([
            {
                id: 'b1',
                capacity: 4,
                nuts: [
                    { id: 'r1', color: 'red' },
                    { id: 'r2', color: 'red' },
                ],
            },
            {
                id: 'b2',
                capacity: 4,
                nuts: [
                    { id: 'r3', color: 'red' },
                    { id: 'r4', color: 'red' },
                ],
            },
        ])

        expect(computeSortedPercent(state)).toBe(99)
    })
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
