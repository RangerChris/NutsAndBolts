import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import TopBar from '../../src/components/TopBar';
import { _clearStorage, addEndlessCompleted, setLevelCompleted } from '../../src/lib/persistence';

afterEach(() => {
    cleanup();
});

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

        it('shows Endless completed count for endless mode using endlessCount', () => {
            // Journey completions should not affect endless count display.
            setLevelCompleted('easy', 1);
            setLevelCompleted('easy', 2);
            addEndlessCompleted('easy');
            render(<TopBar level={1} difficulty="easy" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/Endless/)).toBeTruthy();
            expect(screen.getByText(/Completed 1/)).toBeTruthy();
        });

        it('shows endless completed counts for all endless difficulties', () => {
            addEndlessCompleted('easy');
            addEndlessCompleted('medium');
            addEndlessCompleted('medium');
            addEndlessCompleted('hard');
            addEndlessCompleted('hard');
            addEndlessCompleted('hard');
            addEndlessCompleted('extreme');
            addEndlessCompleted('extreme');
            addEndlessCompleted('extreme');
            addEndlessCompleted('extreme');

            const { rerender } = render(<TopBar level={1} difficulty="easy" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/easy • Completed 1/i)).toBeTruthy();

            rerender(<TopBar level={1} difficulty="medium" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/medium • Completed 2/i)).toBeTruthy();

            rerender(<TopBar level={1} difficulty="hard" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/hard • Completed 3/i)).toBeTruthy();

            rerender(<TopBar level={1} difficulty="extreme" playMode={'endless'} showSeed={false} />);
            expect(screen.getByText(/extreme • Completed 4/i)).toBeTruthy();
        });
    });
}
