import { describe, it, expect } from 'vitest';
import { pickTopGroup, canPlaceGroup, performMove, executeMoveOnState, undoLastMove, isWin, validateState, computeSolutionPath } from '../../src/lib/engine';
import type { Bolt } from '../../src/lib/types';
import type { GameState } from '../../src/lib/types';

describe('engine helpers', () => {
  it('picks contiguous top group correctly', () => {
    const b: Bolt = { id: 'b1', capacity: 4, nuts: ['red', 'red', 'blue', 'blue'] };
    const res = pickTopGroup(b);
    expect(res.color).toBe('blue');
    expect(res.count).toBe(2);
  });

  it('validates placement on empty target', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red', 'red'] };
    const tgt: Bolt = { id: 't', capacity: 4, nuts: [] };
    const top = pickTopGroup(src);
    const ok = canPlaceGroup(src, tgt, top.count);
    expect(ok.ok).toBe(true);
  });

  it('rejects placement when target is full', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red', 'red', 'red'] };
    const tgt: Bolt = { id: 't', capacity: 3, nuts: ['blue', 'blue', 'blue'] };
    const top = pickTopGroup(src);
    const ok = canPlaceGroup(src, tgt, top.count);
    expect(ok.ok).toBe(false);
    expect(ok.reason).toBe('capacity');
  });

  it('rejects placement when target lacks room for the full top group', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red', 'red', 'red'] };
    const tgt: Bolt = { id: 't', capacity: 4, nuts: [] };
    tgt.nuts = ['blue', 'blue', 'blue'];
    const top = pickTopGroup(src);
    const ok = canPlaceGroup(src, tgt, top.count);
    expect(ok.ok).toBe(false);
    expect(ok.reason).toBe('capacity');
  });

  it('performs a legal move and returns a Move', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red', 'red'] };
    const tgt: Bolt = { id: 't', capacity: 4, nuts: [] };
    const move = performMove(src, tgt);
    expect(move).not.toBeNull();
    expect(move?.count).toBe(2);
    expect(src.nuts.length).toBe(0);
    expect(tgt.nuts.length).toBe(2);
  });

  it('does not perform move when target has limited room for full group', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red', 'red', 'red'] };
    const tgt: Bolt = { id: 't', capacity: 4, nuts: ['red', 'red', 'red'] };
    const move = performMove(src, tgt);
    expect(move).toBeNull();
    expect(src.nuts.length).toBe(3);
    expect(tgt.nuts.length).toBe(3);
  });

  it('does not perform illegal move (color mismatch)', () => {
    const src: Bolt = { id: 's', capacity: 4, nuts: ['red'] };
    const tgt: Bolt = { id: 't', capacity: 4, nuts: ['blue'] };
    const move = performMove(src, tgt);
    expect(move).toBeNull();
    expect(src.nuts.length).toBe(1);
    expect(tgt.nuts.length).toBe(1);
  });

  it('executeMoveOnState updates state and records history', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 4, nuts: ['red', 'red'] },
        { id: 'b', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    const res = executeMoveOnState(state, 'a', 'b');
    expect(res.success).toBe(true);
    expect(state.bolts[0].nuts.length).toBe(0);
    expect(state.bolts[1].nuts.length).toBe(2);
    expect(state.moveHistory.length).toBe(1);
  });

  it('executeMoveOnState fails when room is insufficient for full group', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 4, nuts: ['red', 'red', 'red'] },
        { id: 'b', capacity: 4, nuts: ['red', 'red', 'red'] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    const res = executeMoveOnState(state, 'a', 'b');
    expect(res.success).toBe(false);
    expect(res.reason).toBe('capacity');
    expect(state.bolts[0].nuts.length).toBe(3);
    expect(state.bolts[1].nuts.length).toBe(3);
    expect(state.moveHistory.length).toBe(0);
  });

  it('undoLastMove reverts the last move', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 4, nuts: ['red', 'red'] },
        { id: 'b', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    const res = executeMoveOnState(state, 'a', 'b');
    expect(res.success).toBe(true);
    const undoRes = undoLastMove(state);
    expect(undoRes.success).toBe(true);
    expect(state.bolts[0].nuts.length).toBe(2);
    expect(state.bolts[1].nuts.length).toBe(0);
  });

  it('isWin detects solved state', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 4, nuts: ['red', 'red'] },
        { id: 'b', capacity: 4, nuts: ['blue', 'blue'] },
        { id: 'c', capacity: 4, nuts: [] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    expect(isWin(state)).toBe(true);
    state.bolts[1].nuts = ['blue', 'red'];
    expect(isWin(state)).toBe(false);
  });

  it('isWin fails when same color exists on multiple bolts', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 4, nuts: ['red', 'red'] },
        { id: 'b', capacity: 4, nuts: ['red'] },
      ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    expect(isWin(state)).toBe(false);
  });

  it('validateState catches simple invariants', () => {
    const state: GameState = {
      bolts: [ { id: 'a', capacity: 1, nuts: ['x','y'] } ],
      extraBoltUsed: false,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };
    const v = validateState(state);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('bolt-over-capacity');
  });

  it('computeSolutionPath returns a valid first solving move', () => {
    const state: GameState = {
      bolts: [
        { id: 'a', capacity: 2, nuts: ['red', 'blue'] },
        { id: 'b', capacity: 2, nuts: ['red'] },
        { id: 'c', capacity: 2, nuts: [] },
      ],
      extraBoltUsed: true,
      level: 1,
      difficulty: 'easy',
      moveHistory: [],
    };

    const path = computeSolutionPath(state, { maxDepth: 20, maxStates: 10000 });
    expect(path).not.toBeNull();
    expect(path?.length).toBeGreaterThan(0);
    expect(path?.[0]).toMatchObject({ fromBoltId: 'a', toBoltId: 'c', color: 'blue', count: 1 });
  });
});
