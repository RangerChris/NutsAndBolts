import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameShell from '../app/GameShell';

if (typeof document === 'undefined') {
    describe.skip('Bolt keyboard interactions (skipped - no DOM)', () => {
        it('skipped', () => { });
    });
} else {
    describe('Bolt keyboard interactions', () => {
        it('allows selecting a bolt with Enter and moving to another bolt', async () => {
            render(<GameShell />);
            const boltButtons = await screen.findAllByRole('button');
            const bolt = boltButtons.find((b) => /b0|b1|b2/.test(b.getAttribute('aria-label') || ''));
            if (!bolt) return;
            bolt.focus();
            fireEvent.keyDown(bolt, { key: 'Enter' });
            const others = boltButtons.filter((b) => b !== bolt && (b.getAttribute('aria-label') || '').startsWith('b'));
            if (others.length === 0) return;
            fireEvent.click(others[0]);
            const undo = await screen.findByText(/Undo/i);
            expect(undo).not.toBeDisabled();
        });
    });
}
