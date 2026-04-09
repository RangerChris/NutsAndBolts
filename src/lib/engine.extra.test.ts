import { describe, it, expect, beforeEach } from 'vitest';
import { undoLastMove, executeMoveOnState, isWin } from './engine';
import type { GameState } from './types';

function makeState(): GameState {
  return {
    bolts: [
      { id: 'b0', capacity: 4, nuts: ['red', 'red'] },
      { id: 'b1', capacity: 4, nuts: [] },
    ],
    extraBoltUsed: false,
    level: 1,
    difficulty: 'easy',
    seed: 'test',
    moveHistory: [],
  } as unknown as GameState;
}

describe('undo and win helpers', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
  });

  it('executes a move and can undo it, restoring state', () => {
    const beforeCountSrc = state.bolts[0].nuts.length;
    const beforeCountTgt = state.bolts[1].nuts.length;
    const ex = executeMoveOnState(state, 'b0', 'b1');
    expect(ex.success).toBe(true);
    expect(state.moveHistory.length).toBe(1);
    expect(state.bolts[0].nuts.length).toBeLessThan(beforeCountSrc);
    expect(state.bolts[1].nuts.length).toBeGreaterThan(beforeCountTgt);

    const undo = undoLastMove(state);
    expect(undo.success).toBe(true);
    expect(state.moveHistory.length).toBe(0);
    expect(state.bolts[0].nuts.length).toBe(beforeCountSrc);
    expect(state.bolts[1].nuts.length).toBe(beforeCountTgt);

    const undo2 = undoLastMove(state);
    expect(undo2.success).toBe(false);
    expect(undo2.reason).toBe('no-history');
  });

  it('detects win state correctly', () => {
    const winState = makeState();
    winState.bolts = [
      { id: 'a', capacity: 3, nuts: ['x', 'x', 'x'] },
      { id: 'b', capacity: 3, nuts: [] },
    ];
    expect(isWin(winState)).toBe(true);

    winState.bolts[0].nuts = ['x', 'y'];
    expect(isWin(winState)).toBe(false);
  });
});
