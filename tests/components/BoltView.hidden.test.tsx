import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BoltView from '../../src/components/BoltView';

if (typeof document === 'undefined') {
    describe.skip('BoltView hidden nuts rendering (skipped - no DOM)', () => {
        it('skipped', () => { });
    });
} else {
    describe('BoltView hidden nuts rendering', () => {
        it('renders underlying nuts as hidden when hiddenNuts is true', () => {
            const bolt = {
                id: 'b0',
                capacity: 4,
                nuts: [
                    { id: 'b0-n0', color: 'c0', revealed: false },
                    { id: 'b0-n1', color: 'c1', revealed: false },
                    { id: 'b0-n2', color: 'c2', revealed: true },
                ],
            };
            const { container } = render(<BoltView bolt={bolt} paletteId={0} hiddenNuts={true} />);

            const hidden0 = container.querySelector('[data-nut-index="0"] rect[data-hidden="true"]');
            const hidden1 = container.querySelector('[data-nut-index="1"] rect[data-hidden="true"]');
            const top = container.querySelector('[data-nut-index="2"] rect[data-hidden="true"]');

            expect(hidden0).not.toBeNull();
            expect(hidden1).not.toBeNull();
            expect(top).toBeNull();
        });

        it('selects only the top contiguous color group', () => {
            const bolt = {
                id: 'b0',
                capacity: 4,
                nuts: [
                    { id: 'b0-n0', color: 'c0', revealed: true },
                    { id: 'b0-n1', color: 'c1', revealed: true },
                    { id: 'b0-n2', color: 'c1', revealed: true },
                ],
            };

            const { container } = render(<BoltView bolt={bolt} paletteId={0} selected={true} />);

            const root = container.querySelector('[data-bolt="b0"]');
            const selectedGroup = container.querySelectorAll('[data-selected-top-group="true"]');

            expect(root?.classList.contains('bolt-selected')).toBe(false);
            expect(selectedGroup).toHaveLength(2);
            expect(container.querySelector('[data-nut-index="0"][data-selected-top-group="true"]')).toBeNull();
            expect(container.querySelector('[data-nut-index="1"][data-selected-top-group="true"]')).not.toBeNull();
            expect(container.querySelector('[data-nut-index="2"][data-selected-top-group="true"]')).not.toBeNull();
        });
    });
}
