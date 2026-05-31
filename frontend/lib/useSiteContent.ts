'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let cache: Record<string, string> | null = null;
let fetching = false;
let listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useSiteContent() {
  const [content, setContent] = useState<Record<string, string>>(cache || {});

  useEffect(() => {
    if (cache) { setContent(cache); return; }
    if (!fetching) {
      fetching = true;
      fetch(`${API}/api/content`)
        .then(r => r.json())
        .then(d => { cache = d.data || {}; notifyListeners(); })
        .catch(() => { cache = {}; })
        .finally(() => { fetching = false; });
    }
    const listener = () => { if (cache) setContent({ ...cache }); };
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  const get = (key: string, fallback: string = '') => content[key] || fallback;

  return { content, get };
}
