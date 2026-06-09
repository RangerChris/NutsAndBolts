import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TopBar from '../../src/components/TopBar';
import { _clearStorage, addEndlessCompleted, setLevelCompleted } from '../../src/lib/persistence';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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

        // --- Seed display / edit / copy ---

        it('shows an em-dash when no seed is provided', () => {
            render(<TopBar level={1} difficulty="easy" showSeed={true} />);
            expect(screen.getByText('—')).toBeTruthy();
        });

        it('shows the current seed value and an Edit button', () => {
            render(<TopBar level={1} difficulty="easy" seed="hello-world" showSeed={true} />);
            expect(screen.getByText('hello-world')).toBeTruthy();
            expect(screen.getByText('Edit')).toBeTruthy();
            expect(screen.getByText('Copy')).toBeTruthy();
        });

        it('does not render the seed section when showSeed is false', () => {
            render(<TopBar level={1} difficulty="easy" seed="hello-world" showSeed={false} />);
            expect(screen.queryByText('Edit')).toBeNull();
            expect(screen.queryByText('Copy')).toBeNull();
            expect(screen.queryByText('hello-world')).toBeNull();
        });

        it('copies the seed to clipboard when Copy is clicked', () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText },
                configurable: true,
                writable: true,
            });
            render(<TopBar level={1} difficulty="easy" seed="copy-me" showSeed={true} />);
            fireEvent.click(screen.getByText('Copy'));
            expect(writeText).toHaveBeenCalledWith('copy-me');
        });

        it('swallows errors thrown by clipboard.writeText', () => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: () => { throw new Error('no clipboard'); } },
                configurable: true,
                writable: true,
            });
            render(<TopBar level={1} difficulty="easy" seed="copy-me" showSeed={true} />);
            expect(() => fireEvent.click(screen.getByText('Copy'))).not.toThrow();
        });

        it('enters edit mode when Edit is clicked', () => {
            render(<TopBar level={1} difficulty="easy" seed="abc" showSeed={true} />);
            fireEvent.click(screen.getByText('Edit'));
            const input = screen.getByLabelText('Seed') as HTMLInputElement;
            expect(input).toBeTruthy();
            expect(input.value).toBe('abc');
            expect(screen.getByText('Save')).toBeTruthy();
            expect(screen.getByText('Cancel')).toBeTruthy();
        });

        it('saves the edited seed via onSeedChange on Enter and exits edit mode', () => {
            const onSeedChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" seed="abc" showSeed={true} onSeedChange={onSeedChange} />);
            fireEvent.click(screen.getByText('Edit'));
            const input = screen.getByLabelText('Seed') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'new-seed' } });
            fireEvent.keyDown(input, { key: 'Enter' });
            expect(onSeedChange).toHaveBeenCalledWith('new-seed');
            // After save, edit form is gone. The displayed seed reverts to the prop
            // because the useEffect resyncs seedValue from the seed prop.
            expect(screen.queryByText('Save')).toBeNull();
            const seedSpan = document.querySelector('.topbar-seed-value');
            expect(seedSpan?.textContent).toBe('abc');
        });

        it('cancels edit on Escape and reverts the displayed seed', () => {
            const onSeedChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" seed="abc" showSeed={true} onSeedChange={onSeedChange} />);
            fireEvent.click(screen.getByText('Edit'));
            const input = screen.getByLabelText('Seed') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'discarded' } });
            fireEvent.keyDown(input, { key: 'Escape' });
            expect(onSeedChange).not.toHaveBeenCalled();
            // Back to display mode showing the original seed.
            expect(screen.queryByText('Save')).toBeNull();
            expect(screen.getByText('abc')).toBeTruthy();
            expect(screen.queryByText('discarded')).toBeNull();
        });

        it('saves the edited seed when the Save button is clicked', () => {
            const onSeedChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" seed="abc" showSeed={true} onSeedChange={onSeedChange} />);
            fireEvent.click(screen.getByText('Edit'));
            const input = screen.getByLabelText('Seed') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'saved-value' } });
            fireEvent.click(screen.getByText('Save'));
            expect(onSeedChange).toHaveBeenCalledWith('saved-value');
        });

        it('cancels edit when the Cancel button is clicked and reverts the seed', () => {
            const onSeedChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" seed="abc" showSeed={true} onSeedChange={onSeedChange} />);
            fireEvent.click(screen.getByText('Edit'));
            const input = screen.getByLabelText('Seed') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'never' } });
            fireEvent.click(screen.getByText('Cancel'));
            expect(onSeedChange).not.toHaveBeenCalled();
            expect(screen.getByText('abc')).toBeTruthy();
        });

        it('syncs the displayed seed when the prop changes (after exiting edit mode)', () => {
            const { rerender } = render(<TopBar level={1} difficulty="easy" seed="first" showSeed={true} />);
            rerender(<TopBar level={1} difficulty="easy" seed="second" showSeed={true} />);
            expect(screen.getByText('second')).toBeTruthy();
        });

        // --- Show debug / Force hidden ---

        it('renders the Show debug checkbox', () => {
            const onChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={false} onShowDebugChange={onChange} />);
            const checkbox = screen.getByRole('checkbox', { name: /show debug/i }) as HTMLInputElement;
            expect(checkbox.checked).toBe(false);
            fireEvent.click(checkbox);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('does not call onShowDebugChange when no handler is provided', () => {
            render(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={false} />);
            const checkbox = screen.getByRole('checkbox', { name: /show debug/i });
            expect(() => fireEvent.click(checkbox)).not.toThrow();
        });

        it('shows the Force Hidden Nuts checkbox only when showDebug is true', () => {
            const { rerender } = render(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={false} />);
            expect(screen.queryByRole('checkbox', { name: /force hidden nuts/i })).toBeNull();
            rerender(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={true} />);
            expect(screen.getByRole('checkbox', { name: /force hidden nuts/i })).toBeTruthy();
        });

        it('toggles Force Hidden Nuts and reports the new value via onForceHiddenChange', () => {
            const onChange = vi.fn();
            render(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={true} forceHidden={false} onForceHiddenChange={onChange} />);
            const checkbox = screen.getByRole('checkbox', { name: /force hidden nuts/i });
            fireEvent.click(checkbox);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('reflects the current forceHidden prop on the checkbox', () => {
            render(<TopBar level={1} difficulty="easy" showSeed={true} showDebug={true} forceHidden={true} />);
            const checkbox = screen.getByRole('checkbox', { name: /force hidden nuts/i }) as HTMLInputElement;
            expect(checkbox.checked).toBe(true);
        });

        // --- Error path: loadProgress throws inside Endless label ---

        it('renders an empty Endless label when loadProgress throws', async () => {
            // Use vi.resetModules + dynamic import to get a module instance with a
            // throw-only loadProgress. Then render TopBar with that isolated copy.
            vi.resetModules();
            vi.doMock('../../src/lib/persistence', async () => {
                const actual = await vi.importActual<typeof import('../../src/lib/persistence')>('../../src/lib/persistence');
                return {
                    ...actual,
                    loadProgress: () => { throw new Error('boom'); },
                };
            });
            const { default: TopBarThrow } = await import('../../src/components/TopBar');
            render(<TopBarThrow level={1} difficulty="easy" playMode={'endless'} showSeed={false} />);
            const status = screen.getByText(/Endless/).parentElement!;
            // The catch returns '' so the only meaningful text is the strong tag.
            expect(status.querySelector('strong')?.textContent).toBe('Endless');
            // Strip the strong content and the trailing colon/whitespace; the rest should be empty.
            expect(status.textContent?.replace(/Endless/, '').replace(/[:\s]/g, '')).toBe('');
            vi.doUnmock('../../src/lib/persistence');
            vi.resetModules();
        });
    });
}
