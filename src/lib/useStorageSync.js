// PowerFit Global Reactivity Hook
// Emits custom events after storage mutations and provides
// a hook for components to subscribe and auto-refresh.

const EVENT_NAME = 'powerfit:data-changed';

// Call this after any mutation to notify all subscribers
export function notifyDataChange(entity) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { entity, timestamp: Date.now() } }));
}

// React hook — returns a counter that increments on every data change.
// Components use this as a useEffect dependency to re-fetch.
import { useState, useEffect, useCallback } from 'react';

export function useStorageSync(entityFilter) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      // If entityFilter is set, only react to that entity type
      if (entityFilter && e.detail?.entity && e.detail.entity !== entityFilter) return;
      setRevision(prev => prev + 1);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [entityFilter]);

  // Manual refresh trigger for imperative use
  const refresh = useCallback(() => setRevision(prev => prev + 1), []);

  return { revision, refresh };
}
