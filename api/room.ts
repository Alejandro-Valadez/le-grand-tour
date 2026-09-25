// API unique du jeu : GET /api/room?code=ABCD  ·  POST /api/room { op, ... }
import { addPlayer, advance, applyAction, createRoom, GameError, sanitize } from '../shared/engine.js';
import { getStore } from '../shared/store.js';
import type { Action, ServerRoom } from '../shared/types.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_RE = /^[A-Z]{4}$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const NOT_FOUND = new GameError('Partie introuvable. Vérifie le code !', 'Game not found. Check the code!');

function readCode(raw: unknown): string {
  const code = String(raw ?? '').trim().toUpperCase();
  if (!CODE_RE.test(code)) throw new GameError('Le code doit avoir 4 lettres.', 'The code must be 4 letters.');
  return code;
}

/**
 * Lit la partie, applique `fn`, puis écrit seulement si personne n’a écrit entre-temps
 * (compare-and-set sur la version). En cas de conflit, on recommence avec l’état frais.
 */
async function withRoom<R>(code: string, fn: (room: ServerRoom, now: number) => R, initial?: ServerRoom) {
  const store = getStore();
  let room = initial ?? null;
  for (let attempt = 0; attempt < 12; attempt++) {
    if (!room) room = await store.get(code);
    if (!room) throw NOT_FOUND;
    const prev = room.version;
    const now = Date.now();
    const result = fn(room, now);
    room.version = prev + 1;
    if (await store.cas(room, prev)) return { room, result };
    room = null;
    await sleep(20 + Math.random() * 60);
  }
  throw new GameError('Le serveur est occupé. Réessaie !', 'The server is busy. Try again!');
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = readCode(url.searchParams.get('code'));
    const store = getStore();
    let room = await store.get(code);
    if (!room) throw NOT_FOUND;

    // Les délais expirés sont résolus paresseusement, par le premier client qui demande l’état.
    const probe: ServerRoom = structuredClone(room);
    if (advance(probe, Date.now())) {
      ({ room } = await withRoom(code, (r, now) => advance(r, now), room));
    }
    return json({ room: sanitize(room), now: Date.now(), store: store.kind });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const store = getStore();

    if (body.op === 'create') {
      for (let i = 0; i < 20; i++) {
        const code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
        const { room, player } = createRoom(code, body.name, body.avatar, Date.now());
        if (await store.create(room)) {
          return json({ room: sanitize(room), now: Date.now(), you: { id: player.id, token: player.token } });
        }
      }
      throw new GameError('Impossible de créer la partie. Réessaie !', 'Couldn’t create the game. Try again!');
    }

    const code = readCode(body.code);

    if (body.op === 'join') {
      const { room, result: p } = await withRoom(code, (r, now) => {
        advance(r, now);
        return addPlayer(r, body.name, body.avatar, now);
      });
      return json({ room: sanitize(room), now: Date.now(), you: { id: p.id, token: p.token } });
    }

    if (body.op === 'act') {
      const id = String(body.id ?? '');
      const token = String(body.token ?? '');
      const action = body.action as Action;
      if (!action || typeof action !== 'object' || typeof action.type !== 'string') throw new GameError('Action invalide.', 'Invalid action.');
      const { room, result: failure } = await withRoom(code, (r, now) => {
        const me = r.players.find((p) => p.id === id);
        if (!me || me.token !== token) throw new GameError('Tu ne fais plus partie de cette partie.', 'You’re no longer in this game.');
        advance(r, now);
        try {
          applyAction(r, id, action, now);
          return null;
        } catch (e) {
          if (e instanceof GameError) return e;
          throw e;
        }
      });
      if (failure) return json({ error: failure.message, errorEn: failure.en, room: sanitize(room), now: Date.now() }, 409);
      return json({ room: sanitize(room), now: Date.now() });
    }

    return json({ error: 'Opération inconnue.', errorEn: 'Unknown operation.' }, 400);
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown): Response {
  if (e instanceof GameError) return json({ error: e.message, errorEn: e.en }, e === NOT_FOUND ? 404 : 400);
  console.error(e);
  return json({ error: 'Oups ! Erreur du serveur.', errorEn: 'Oops! Server error.' }, 500);
}
