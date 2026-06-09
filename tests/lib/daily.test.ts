import { describe, it, expect } from 'vitest';
import { getDailySeed, getDailyDateString } from '../../src/lib/daily';

describe('getDailySeed', () => {
  it('uses current date when no argument is given', () => {
    const before = new Date().toISOString().slice(0, 10);
    const seed = getDailySeed();
    const after = new Date().toISOString().slice(0, 10);
    const m = seed.match(/^daily-v1-(\d{4}-\d{2}-\d{2})$/);
    expect(m).not.toBeNull();
    expect([before, after]).toContain(m![1]);
  });

  it('formats the provided date in UTC YYYY-MM-DD', () => {
    expect(getDailySeed(new Date('2024-01-15T00:00:00Z'))).toBe('daily-v1-2024-01-15');
    expect(getDailySeed(new Date('2024-12-31T23:59:59Z'))).toBe('daily-v1-2024-12-31');
    expect(getDailySeed(new Date('2024-06-01T12:34:56Z'))).toBe('daily-v1-2024-06-01');
  });

  it('does not mutate the passed-in Date', () => {
    const d = new Date('2024-03-10T05:00:00Z');
    const t = d.getTime();
    getDailySeed(d);
    expect(d.getTime()).toBe(t);
  });

  it('produces the same seed for the same UTC day regardless of local time', () => {
    const a = new Date('2024-07-04T01:00:00Z');
    const b = new Date('2024-07-04T22:00:00Z');
    expect(getDailySeed(a)).toBe(getDailySeed(b));
  });

  it('produces different seeds across consecutive days', () => {
    const a = getDailySeed(new Date('2024-01-01T00:00:00Z'));
    const b = getDailySeed(new Date('2024-01-02T00:00:00Z'));
    expect(a).not.toBe(b);
  });
});

describe('getDailyDateString', () => {
  it('extracts the YYYY-MM-DD portion from a valid seed', () => {
    expect(getDailyDateString('daily-v1-2024-01-15')).toBe('2024-01-15');
    expect(getDailyDateString('daily-v1-2024-12-31')).toBe('2024-12-31');
  });

  it('round-trips with getDailySeed', () => {
    const d = new Date('2024-05-20T10:00:00Z');
    const seed = getDailySeed(d);
    expect(getDailyDateString(seed)).toBe('2024-05-20');
  });

  it('returns null for non-matching seeds', () => {
    expect(getDailyDateString('not-a-seed')).toBeNull();
    expect(getDailyDateString('')).toBeNull();
    expect(getDailyDateString('daily-v2-2024-01-15')).toBeNull();
    expect(getDailyDateString('daily-v1-24-01-15')).toBeNull();
  });
});
