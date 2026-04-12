import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TopBar from './TopBar';
import { _clearStorage, setLevelCompleted } from '../lib/persistence';

if (typeof document === 'undefined') {
    describe.skip('TopBar (skipped - no DOM)', () => {
        it('skipped', () => { });
    });
} else {
    describe('TopBar', () => {
        beforeEach(() => {
            // reset persisted progress between tests
            try { _clearStorage(); } catch { }
        });

        it('shows Level for journey mode', () => {
            render(<TopBar level={3} difficulty="easy" playMode={'journey'} showSeed={false} />);
            expect(screen.getByText(/Level/)).toBeTruthy();
            expect(screen.getByText(/3/)).toBeTruthy();
        });

        it('does not show level or endless label for daily mode', () => {
            render(<TopBar level={1} difficulty="easy" playMode={'daily'} showSeed={false} />);
            expect(screen.queryByText(/Level/)).toBeNull();
            expect(screen.queryByText(/Endless/)).toBeNull();
        });

        it('shows Endless completed count for endless mode', () => {
            // record two completed entries for easy
            setLevelCompleted('easy', 1);
            setLevelCompleted('easy', 2);
            render(<TopBar level={1} difficulty="easy" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/Endless/)).toBeTruthy();
            expect(screen.getByText(/Completed 2/)).toBeTruthy();
        });
    });
}
