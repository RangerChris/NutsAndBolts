import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
                move: { fromBoltId: 'b0', toBoltId: 'b1', count: 1 },
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

        it('hides destination moved nuts while move animation is active', () => {
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
                        nuts: [
                            { id: 'b1-n0', color: 'c1', revealed: true },
                            { id: 'b1-n1', color: 'c2', revealed: true },
                        ],
                    },
                ],
                extraBoltUsed: false,
                level: 1,
                difficulty: 'easy',
                moveHistory: [],
            };

            const animMove = {
                move: { fromBoltId: 'b0', toBoltId: 'b1', count: 1 },
                preRects: [
                    {
                        left: 10,
                        top: 10,
                        width: 66,
                        height: 20,
                        color: '#ff0000',
                    },
                ],
            } as AnimMove;

            render(
                <Board
                    state={state}
                    paletteId={0}
                    onBoltClick={() => { }}
                    animMove={animMove}
                />
            );

            expect(document.querySelectorAll('[data-move-target-hidden="true"]').length).toBeGreaterThanOrEqual(1);
        });

        it('animates only hint preview nut clones and cleans them up', () => {
            vi.useFakeTimers();

            const state: GameState = {
                bolts: [
                    {
                        id: 'b0',
                        capacity: 4,
                        nuts: [
                            { id: 'b0-n0', color: 'c0', revealed: true },
                            { id: 'b0-n1', color: 'c1', revealed: true },
                            { id: 'b0-n2', color: 'c1', revealed: true },
                        ],
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

            const onHintDone = vi.fn();

            render(
                <Board
                    state={state}
                    paletteId={0}
                    onBoltClick={() => { }}
                    hintPreview={{ fromBoltId: 'b0', toBoltId: 'b1', count: 2, allowed: true }}
                    onHintDone={onHintDone}
                />
            );

            vi.advanceTimersByTime(50);
            expect(document.body.querySelectorAll('.hint-preview-clone').length).toBe(2);
            expect(document.querySelectorAll('[data-hint-source-hidden="true"]').length).toBe(2);

            vi.advanceTimersByTime(900);
            expect(onHintDone).toHaveBeenCalledTimes(1);
            expect(document.body.querySelector('.hint-preview-clone')).toBeNull();

            vi.useRealTimers();
        });
    });
}
