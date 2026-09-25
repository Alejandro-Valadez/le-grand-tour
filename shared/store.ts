// Stockage des parties : Redis (REDIS_URL ou Upstash) en production, mémoire en local.
// Les écritures sont « optimistes » : on n'écrit que si la version n'a pas changé (compare-and-set).
import { Redis } from '@upstash/redis';
import { createClient, type RedisClientType } from 'redis';
import type { ServerRoom } from './types.js';

const ROOM_TTL_S = 60 * 60 * 12;

export interface Store {
  kind: 'redis' | 'memory';
  get(code: string): Promise<ServerRoom | null>;
  /** Crée la partie seulement si le code est libre. */
  create(room: ServerRoom): Promise<boolean>;
  /** Écrit la partie seulement si la version stockée vaut encore `prevVersion`. */
  cas(room: ServerRoom, prevVersion: number): Promise<boolean>;
}

const roomKey = (code: string) => `grandtour:room:${code}`;

// Une seule commande Redis par écriture : compare la version puis remplace.
const CAS = `local cur = redis.call('GET', KEYS[1])
if not cur then return -1 end
if cjson.decode(cur).version ~= tonumber(ARGV[2]) then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[3]))
return 1`;

function upstashStore(url: string, token: string): Store {
  const redis = new Redis({ url, token, automaticDeserialization: false });
  return {
    kind: 'redis',
    async get(code) {
      const raw = await redis.get<string>(roomKey(code));
      return raw ? (JSON.parse(raw) as ServerRoom) : null;
    },
    async create(room) {
      return (await redis.set(roomKey(room.code), JSON.stringify(room), { ex: ROOM_TTL_S, nx: true })) === 'OK';
    },
    async cas(room, prev) {
      const r = await redis.eval(CAS, [roomKey(room.code)], [JSON.stringify(room), String(prev), String(ROOM_TTL_S)]);
      return Number(r) === 1;
    },
  };
}

// Redis « classique » (REDIS_URL, ex. l’intégration Redis de Vercel). La connexion est réutilisée entre les appels.
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
    async create(room) {
      const r = await (await c()).set(roomKey(room.code), JSON.stringify(room), { condition: 'NX', expiration: { type: 'EX', value: ROOM_TTL_S } });
      return r === 'OK';
    },
    async cas(room, prev) {
      const r = await (await c()).eval(CAS, { keys: [roomKey(room.code)], arguments: [JSON.stringify(room), String(prev), String(ROOM_TTL_S)] });
      return Number(r) === 1;
    },
  };
}

type Mem = { rooms: Map<string, { json: string; exp: number }> };
const g = globalThis as unknown as { __grandTourMem?: Mem };

function memoryStore(): Store {
  const mem = (g.__grandTourMem ??= { rooms: new Map() });
  const read = (code: string) => {
    const e = mem.rooms.get(code);
    return !e || e.exp < Date.now() ? null : (JSON.parse(e.json) as ServerRoom);
  };
  const write = (room: ServerRoom) => mem.rooms.set(room.code, { json: JSON.stringify(room), exp: Date.now() + ROOM_TTL_S * 1000 });
  return {
    kind: 'memory',
    async get(code) {
      return read(code);
    },
    async create(room) {
      if (read(room.code)) return false;
      write(room);
      return true;
    },
    async cas(room, prev) {
      const cur = read(room.code);
      if (!cur || cur.version !== prev) return false;
      write(room);
      return true;
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (restUrl && restToken) cached = upstashStore(restUrl, restToken);
  else if (redisUrl) cached = tcpStore(redisUrl);
  else cached = memoryStore();
  return cached;
}
