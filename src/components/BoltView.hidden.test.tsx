import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BoltView from './BoltView';

if (typeof document === 'undefined') {
    describe.skip('BoltView hidden nuts rendering (skipped - no DOM)', () => {
        it('skipped', () => { });
    });
} else {
    describe('BoltView hidden nuts rendering', () => {
        it('renders underlying nuts as hidden when hiddenNuts is true', () => {
            const bolt = { id: 'b0', capacity: 4, nuts: ['c0', 'c1', 'c2'] };
            const { container } = render(<BoltView bolt={bolt as any} paletteId={0} hiddenNuts={true} />);

            // top nut index = 2 (last); underlying indexes 0 and 1 should be hidden
            const hidden0 = container.querySelector('[data-nut-index="0"] rect[data-hidden="true"]');
            const hidden1 = container.querySelector('[data-nut-index="1"] rect[data-hidden="true"]');
            const top = container.querySelector('[data-nut-index="2"] rect[data-hidden="true"]');

            expect(hidden0).not.toBeNull();
            expect(hidden1).not.toBeNull();
            // top should not be hidden
            expect(top).toBeNull();
        });
    });
}
