// Stockage des parties : Upstash Redis en production, mémoire en local.
import { Redis } from '@upstash/redis';
import { createClient, type RedisClientType } from 'redis';
import type { ServerRoom } from './types.js';

const ROOM_TTL_S = 60 * 60 * 12;
const LOCK_TTL_MS = 5_000;

export interface Store {
  kind: 'redis' | 'memory';
  get(code: string): Promise<ServerRoom | null>;
  set(room: ServerRoom): Promise<void>;
  exists(code: string): Promise<boolean>;
  lock(code: string, token: string): Promise<boolean>;
  unlock(code: string, token: string): Promise<void>;
}

const roomKey = (code: string) => `grandtour:room:${code}`;
const lockKey = (code: string) => `grandtour:lock:${code}`;

function redisStore(url: string, token: string): Store {
  const redis = new Redis({ url, token, automaticDeserialization: false });
  return {
    kind: 'redis',
    async get(code) {
      const raw = await redis.get<string>(roomKey(code));
      return raw ? (JSON.parse(raw) as ServerRoom) : null;
    },
    async set(room) {
      await redis.set(roomKey(room.code), JSON.stringify(room), { ex: ROOM_TTL_S });
    },
    async exists(code) {
      return (await redis.exists(roomKey(code))) > 0;
    },
    async lock(code, t) {
      return (await redis.set(lockKey(code), t, { nx: true, px: LOCK_TTL_MS })) === 'OK';
    },
    async unlock(code, t) {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [lockKey(code)],
        [t],
      );
    },
  };
}

// Redis « classique » (REDIS_URL, ex. l’intégration Redis de Vercel). La connexion est réutilisée entre les appels.
const UNLOCK = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const gc = globalThis as unknown as { __grandTourTcp?: Promise<RedisClientType> };

function tcpClient(url: string): Promise<RedisClientType> {
  if (!gc.__grandTourTcp) {
    const client = createClient({ url, socket: { connectTimeout: 5000, reconnectStrategy: (n) => Math.min(n * 100, 2000) } }) as RedisClientType;
    client.on('error', (e) => console.error('Redis', e));
    gc.__grandTourTcp = client.connect().then(() => client);
    gc.__grandTourTcp.catch(() => {
      gc.__grandTourTcp = undefined;
    });
  }
  return gc.__grandTourTcp;
}

function tcpStore(url: string): Store {
  const c = () => tcpClient(url);
  return {
    kind: 'redis',
    async get(code) {
      const raw = await (await c()).get(roomKey(code));
      return raw ? (JSON.parse(String(raw)) as ServerRoom) : null;
    },
    async set(room) {
      await (await c()).set(roomKey(room.code), JSON.stringify(room), { expiration: { type: 'EX', value: ROOM_TTL_S } });
    },
    async exists(code) {
      return (await (await c()).exists(roomKey(code))) > 0;
    },
    async lock(code, t) {
      const r = await (await c()).set(lockKey(code), t, { condition: 'NX', expiration: { type: 'PX', value: LOCK_TTL_MS } });
      return r === 'OK';
    },
    async unlock(code, t) {
      await (await c()).eval(UNLOCK, { keys: [lockKey(code)], arguments: [t] });
    },
  };
}

type Mem = { rooms: Map<string, { json: string; exp: number }>; locks: Map<string, { t: string; exp: number }> };
const g = globalThis as unknown as { __grandTourMem?: Mem };

function memoryStore(): Store {
  const mem = (g.__grandTourMem ??= { rooms: new Map(), locks: new Map() });
  return {
    kind: 'memory',
    async get(code) {
      const e = mem.rooms.get(code);
      if (!e || e.exp < Date.now()) return null;
      return JSON.parse(e.json) as ServerRoom;
    },
    async set(room) {
      mem.rooms.set(room.code, { json: JSON.stringify(room), exp: Date.now() + ROOM_TTL_S * 1000 });
    },
    async exists(code) {
      return !!(await this.get(code));
    },
    async lock(code, t) {
      const l = mem.locks.get(code);
      if (l && l.exp > Date.now()) return false;
      mem.locks.set(code, { t, exp: Date.now() + LOCK_TTL_MS });
      return true;
    },
    async unlock(code, t) {
      if (mem.locks.get(code)?.t === t) mem.locks.delete(code);
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (redisUrl && !process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
    cached = tcpStore(redisUrl);
    return cached;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  cached = url && token ? redisStore(url, token) : memoryStore();
  return cached;
}
