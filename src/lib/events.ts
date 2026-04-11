type Handler = (payload?: any) => void;

const listeners: Record<string, Handler[]> = {};

export function onEvent(event: string, cb: Handler) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(cb);
  return () => offEvent(event, cb);
}

export function offEvent(event: string, cb: Handler) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter((h) => h !== cb);
}

export function emitEvent(event: string, payload?: any) {
  const handlers = listeners[event] || [];
  for (const h of handlers.slice()) {
    try { h(payload); } catch { }
  }
}

export default { onEvent, offEvent, emitEvent };
