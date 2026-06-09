import { describe, it, expect, vi } from 'vitest';
import { onEvent, offEvent, emitEvent } from '../../src/lib/events';

// Note: events.ts keeps a process-wide listener registry with no exposed reset.
// Each test uses a unique event name so registrations do not leak between tests.

describe('events', () => {
  it('delivers a payload to a registered handler', () => {
    const handler = vi.fn();
    onEvent('e2e:payload', handler);
    emitEvent('e2e:payload', { value: 42 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('invokes multiple handlers in registration order', () => {
    const calls: string[] = [];
    onEvent('e2e:order', () => calls.push('a'));
    onEvent('e2e:order', () => calls.push('b'));
    onEvent('e2e:order', () => calls.push('c'));
    emitEvent('e2e:order');
    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('returns an unsubscribe function from onEvent', () => {
    const handler = vi.fn();
    const off = onEvent('e2e:single', handler);
    emitEvent('e2e:single');
    off();
    emitEvent('e2e:single');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('offEvent removes a specific handler while keeping others', () => {
    const a = vi.fn();
    const b = vi.fn();
    onEvent('e2e:multi', a);
    onEvent('e2e:multi', b);
    offEvent('e2e:multi', a);
    emitEvent('e2e:multi');
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('offEvent is a no-op when the event has no handlers', () => {
    expect(() => offEvent('e2e:never-registered', () => {})).not.toThrow();
  });

  it('offEvent is a no-op when removing a handler that was never registered', () => {
    const a = vi.fn();
    const b = vi.fn();
    onEvent('e2e:partial', a);
    expect(() => offEvent('e2e:partial', b)).not.toThrow();
    emitEvent('e2e:partial');
    expect(a).toHaveBeenCalledTimes(1);
  });

  it('emitEvent with no handlers is a safe no-op', () => {
    expect(() => emitEvent('e2e:nobody', 'x')).not.toThrow();
  });

  it('emitEvent passes undefined when no payload is given', () => {
    const handler = vi.fn();
    onEvent('e2e:nopayload', handler);
    emitEvent('e2e:nopayload');
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('swallows errors thrown by a handler and continues to later handlers', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const order: string[] = [];
    onEvent('e2e:error', () => {
      order.push('before');
      throw new Error('boom');
    });
    onEvent('e2e:error', () => {
      order.push('after');
    });
    expect(() => emitEvent('e2e:error')).not.toThrow();
    expect(order).toEqual(['before', 'after']);
  });
});
