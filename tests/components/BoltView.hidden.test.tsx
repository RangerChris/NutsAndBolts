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
    });
}
