import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onBalancerEvent, emitBalancerEvent, toCsvLine } from '../../src/lib/balancer';

type BalancerEvent = {
  timestamp: number;
  source: string;
  payload: Record<string, unknown>;
};

describe('balancer events', () => {
  let events: BalancerEvent[];
  let offs: Array<() => void>;

  beforeEach(() => {
    events = [];
    offs = [];
  });

  afterEach(() => {
    // Detach every listener registered in this test.
    for (const off of offs) off();
  });

  function subscribe(fn: (ev: BalancerEvent) => void) {
    const off = onBalancerEvent(fn);
    offs.push(off);
    return off;
  }

  it('subscribes a listener that receives emitted events', () => {
    subscribe((ev) => events.push(ev));
    emitBalancerEvent('shuffle', { difficulty: 'easy' });
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('shuffle');
    expect(events[0].payload).toEqual({ difficulty: 'easy' });
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('returns an unsubscribe function that detaches the listener', () => {
    const off = subscribe((ev) => events.push(ev));
    off();
    emitBalancerEvent('shuffle', {});
    expect(events).toHaveLength(0);
  });

  it('detaches only the unsubscribed listener and keeps others', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribe(a);
    subscribe(b);
    offA();
    emitBalancerEvent('shuffle', { x: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('emits to multiple listeners in registration order', () => {
    const order: string[] = [];
    subscribe(() => order.push('a'));
    subscribe(() => order.push('b'));
    subscribe(() => order.push('c'));
    emitBalancerEvent('shuffle', {});
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('isolates listener errors: catches and continues dispatching', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const order: string[] = [];
    subscribe(() => {
      order.push('before');
      throw new Error('listener boom');
    });
    subscribe(() => order.push('after'));
    expect(() => emitBalancerEvent('shuffle', {})).not.toThrow();
    expect(order).toEqual(['before', 'after']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('iterates over a snapshot, so unsubscribing mid-emit does not skip later listeners', () => {
    const order: string[] = [];
    let offA!: () => void;
    offA = subscribe(() => {
      order.push('a');
      offA();
    });
    subscribe(() => order.push('b'));
    emitBalancerEvent('shuffle', {});
    expect(order).toEqual(['a', 'b']);
  });

  it('attaches a stable timestamp per event (non-decreasing)', () => {
    subscribe((ev) => events.push(ev));
    const t0 = Date.now();
    emitBalancerEvent('shuffle', { i: 0 });
    emitBalancerEvent('shuffle', { i: 1 });
    expect(events[0].timestamp).toBeGreaterThanOrEqual(t0);
    expect(events[1].timestamp).toBeGreaterThanOrEqual(events[0].timestamp);
  });
});

describe('toCsvLine', () => {
  it('serializes a row of values as JSON-stringified, comma-separated', () => {
    const ev: BalancerEvent = {
      timestamp: 0,
      source: 'shuffle',
      payload: { difficulty: 'easy', level: 1, optimal: 5 },
    };
    const line = toCsvLine(ev, ['difficulty', 'level', 'optimal']);
    expect(line).toBe('"easy",1,5');
  });

  it('substitutes empty string for missing or null/undefined payload values', () => {
    const ev: BalancerEvent = {
      timestamp: 0,
      source: 'shuffle',
      payload: { a: 'x' },
    };
    const line = toCsvLine(ev, ['a', 'b', 'c']);
    expect(line).toBe('"x","",""');
  });

  it('JSON-escapes strings that contain quotes or commas', () => {
    const ev: BalancerEvent = {
      timestamp: 0,
      source: 'shuffle',
      payload: { label: 'a,b "c"' },
    };
    const line = toCsvLine(ev, ['label']);
    expect(line).toBe('"a,b \\"c\\""');
  });

  it('returns an empty string for an empty key list', () => {
    const ev: BalancerEvent = { timestamp: 0, source: 'shuffle', payload: { x: 1 } };
    expect(toCsvLine(ev, [])).toBe('');
  });

  it('preserves numeric and boolean values (not as quoted strings)', () => {
    const ev: BalancerEvent = {
      timestamp: 0,
      source: 'shuffle',
      payload: { n: 42, b: true, f: 1.5 },
    };
    const line = toCsvLine(ev, ['n', 'b', 'f']);
    expect(line).toBe('42,true,1.5');
  });
});
