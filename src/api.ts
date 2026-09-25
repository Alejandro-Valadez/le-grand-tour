import type { Action, RoomResponse } from '../shared/types';

export interface Identity {
  id: string;
  token: string;
}

const key = (code: string) => `grandtour:${code}`;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Identité de cet onglet (sessionStorage) — sinon celle de l’appareil (localStorage). */
export function getIdentity(code: string): { mine: Identity | null; remembered: Identity | null } {
  const parse = (s: string | null) => (s ? (JSON.parse(s) as Identity) : null);
  const mine = safe(() => parse(sessionStorage.getItem(key(code))), null);
  const remembered = safe(() => parse(localStorage.getItem(key(code))), null);
  return { mine, remembered };
}

export function saveIdentity(code: string, id: Identity) {
  safe(() => sessionStorage.setItem(key(code), JSON.stringify(id)), undefined);
  safe(() => localStorage.setItem(key(code), JSON.stringify(id)), undefined);
}

export function claimIdentity(code: string, id: Identity) {
  safe(() => sessionStorage.setItem(key(code), JSON.stringify(id)), undefined);
}

export function forgetIdentity(code: string) {
  safe(() => sessionStorage.removeItem(key(code)), undefined);
  safe(() => localStorage.removeItem(key(code)), undefined);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: RoomResponse,
    public en: string = message,
  ) {
    super(message);
  }
}

async function call(init: RequestInit & { query?: string }): Promise<RoomResponse> {
  let res: Response;
  try {
    res = await fetch(`/api/room${init.query ?? ''}`, {
      ...init,
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Pas de connexion… Vérifie le Wi-Fi !', 0, undefined, 'No connection… Check the Wi-Fi!');
  }
  const data = (await res.json().catch(() => ({}))) as RoomResponse;
  if (!res.ok) throw new ApiError(data.error || 'Erreur inconnue', res.status, data.room ? data : undefined, data.errorEn || 'Unknown error');
  return data;
}

export const api = {
  get: (code: string) => call({ method: 'GET', query: `?code=${encodeURIComponent(code)}` }),
  create: (name: string, avatar: string) => call({ method: 'POST', body: JSON.stringify({ op: 'create', name, avatar }) }),
  join: (code: string, name: string, avatar: string) =>
    call({ method: 'POST', body: JSON.stringify({ op: 'join', code, name, avatar }) }),
  act: (code: string, me: Identity, action: Action) =>
    call({ method: 'POST', body: JSON.stringify({ op: 'act', code, id: me.id, token: me.token, action }) }),
};
