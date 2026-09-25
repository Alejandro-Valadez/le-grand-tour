import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Room, RoomResponse } from '../shared/types';
import { api, ApiError } from './api';

// ─── Horloge synchronisée avec le serveur ────────────────────

let offset = 0;
let synced = false;

export const serverNow = () => Date.now() + offset;

function syncClock(serverTime: number, t0: number, t1: number) {
  const o = serverTime - (t0 + t1) / 2;
  offset = synced ? offset * 0.7 + o * 0.3 : o;
  synced = true;
}

/** Re-rend le composant toutes les `ms` millisecondes. */
export function useTick(ms = 250) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return serverNow();
}

// ─── État de la partie (sondage régulier) ────────────────────

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const current = useRef<Room | null>(null);

  const accept = useCallback((r: RoomResponse, t0 = Date.now(), t1 = Date.now()) => {
    syncClock(r.now, t0, t1);
    const prev = current.current;
    if (!prev || r.room.createdAt !== prev.createdAt || r.room.version >= prev.version) {
      current.current = r.room;
      setRoom(r.room);
    }
  }, []);

  const refresh = useCallback(async () => {
    const t0 = Date.now();
    try {
      const r = await api.get(code);
      accept(r, t0, Date.now());
      setError(null);
      setOffline(false);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError(e.message);
        return false;
      }
      setOffline(true);
      return true;
    }
  }, [code, accept]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      const keep = await refresh();
      if (!alive || !keep) return;
      timer = setTimeout(loop, document.hidden ? 4000 : 1000);
    };
    loop();
    const onVis = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        loop();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  return { room, error, offline, accept, refresh };
}

// ─── Mini-routeur ────────────────────────────────────────────

export type Route =
  | { name: 'home' }
  | { name: 'rules' }
  | { name: 'aide' }
  | { name: 'room'; code: string }
  | { name: 'tv'; code: string };

function parse(path: string): Route {
  const p = path.replace(/\/+$/, '') || '/';
  let m = p.match(/^\/r\/([a-z]{4})$/i);
  if (m) return { name: 'room', code: m[1].toUpperCase() };
  m = p.match(/^\/tv\/([a-z]{4})$/i);
  if (m) return { name: 'tv', code: m[1].toUpperCase() };
  if (p === '/regles') return { name: 'rules' };
  if (p === '/aide') return { name: 'aide' };
  return { name: 'home' };
}

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('popstate', fn);
  };
};

export function navigate(path: string) {
  if (path === location.pathname) return;
  history.pushState(null, '', path);
  listeners.forEach((fn) => fn());
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, () => location.pathname);
  return parse(path);
}
