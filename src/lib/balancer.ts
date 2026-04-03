type BalancerEvent = {
  timestamp: number;
  source: 'generator' | 'progression' | 'simulation';
  payload: Record<string, any>;
};

type Listener = (ev: BalancerEvent) => void;

const listeners: Listener[] = [];

export function onBalancerEvent(fn: Listener) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function emitBalancerEvent(source: BalancerEvent['source'], payload: Record<string, any>) {
  const ev: BalancerEvent = { timestamp: Date.now(), source, payload };
  for (const l of listeners.slice()) {
    try {
      l(ev);
    } catch (e) {
      // swallow listener errors to avoid breaking generator
      // eslint-disable-next-line no-console
      console.error('balancer listener error', e);
    }
  }
}

// Helper to format a CSV line for simple exports
export function toCsvLine(ev: BalancerEvent, keys: string[]) {
  return keys.map((k) => JSON.stringify(ev.payload[k] ?? '')).join(',');
}

export default { onBalancerEvent, emitBalancerEvent, toCsvLine };
