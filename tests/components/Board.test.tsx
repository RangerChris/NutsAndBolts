import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Board, { type AnimMove } from '../../src/components/Board';
import type { GameState } from '../../src/lib/types';

if (typeof document === 'undefined') {
    describe.skip('Board animation labels (skipped - no DOM)', () => {
        it('skipped', () => { });
    });
} else {
    describe('Board animation labels', () => {
        it('never renders internal color ids like c2 during animation', () => {
            const state: GameState = {
                bolts: [
                    {
                        id: 'b0',
                        capacity: 4,
                        nuts: [{ id: 'b0-n0', color: 'c2', revealed: true }],
                    },
                    {
                        id: 'b1',
                        capacity: 4,
                        nuts: [{ id: 'b1-n0', color: 'c1', revealed: true }],
                    },
                ],
                extraBoltUsed: false,
                level: 1,
                difficulty: 'easy',
                moveHistory: [],
            };

            const animMove = {
                move: { toBoltId: 'b1' },
                preRects: [
                    {
                        left: 10,
                        top: 10,
                        width: 66,
                        height: 20,
                        color: '#ff0000',
                        colorLabel: 'c2',
                    },
                ],
            } as unknown as AnimMove;

            render(
                <Board
                    state={state}
                    paletteId={0}
                    onBoltClick={() => { }}
                    animMove={animMove}
                />
            );

            expect(screen.queryByText('c2')).toBeNull();
            expect(document.body.querySelector('text[data-nut-id]')).toBeNull();
        });
    });
}
