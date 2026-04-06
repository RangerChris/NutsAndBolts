type BalancerEvent = {
  timestamp: number;
  source: string;
  payload: Record<string, unknown>;
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

export function emitBalancerEvent(source: BalancerEvent['source'], payload: Record<string, unknown>) {
  const ev: BalancerEvent = { timestamp: Date.now(), source, payload };
  for (const l of listeners.slice()) {
    try {
      l(ev);
    } catch (e) {
      // swallow listener errors to avoid breaking generator
       
      console.error('balancer listener error', e);
    }
  }
}

// Helper to format a CSV line for simple exports
export function toCsvLine(ev: BalancerEvent, keys: string[]) {
  return keys.map((k) => JSON.stringify(ev.payload[k] ?? '')).join(',');
}

export default { onBalancerEvent, emitBalancerEvent, toCsvLine };
