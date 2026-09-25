// API unique du jeu : GET /api/room?code=ABCD  ·  POST /api/room { op, ... }
import { addPlayer, advance, applyAction, createRoom, GameError, newToken, sanitize } from '../shared/engine.js';
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

function readCode(raw: unknown): string {
  const code = String(raw ?? '').trim().toUpperCase();
  if (!CODE_RE.test(code)) throw new GameError('Le code doit avoir 4 lettres.');
  return code;
}

async function withRoom<R>(code: string, fn: (room: ServerRoom, now: number) => R): Promise<{ room: ServerRoom; result: R }> {
  const store = getStore();
  const t = newToken();
  let locked = false;
  for (let i = 0; i < 80 && !locked; i++) {
    locked = await store.lock(code, t);
    if (!locked) await sleep(40 + Math.random() * 40);
  }
  if (!locked) throw new GameError('Le serveur est occupé. Réessaie !');
  try {
    const room = await store.get(code);
    if (!room) throw new GameError('Partie introuvable. Vérifie le code !');
    const now = Date.now();
    const result = fn(room, now);
    await store.set(room);
    return { room, result };
  } finally {
    await store.unlock(code, t);
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = readCode(url.searchParams.get('code'));
    const store = getStore();
    let room = await store.get(code);
    if (!room) return json({ error: 'Partie introuvable. Vérifie le code !' }, 404);

    // Les délais expirés sont résolus paresseusement, par le premier client qui demande l’état.
    const probe: ServerRoom = structuredClone(room);
    if (advance(probe, Date.now())) {
      ({ room } = await withRoom(code, (r, now) => advance(r, now)));
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
      let code = '';
      for (let i = 0; i < 20; i++) {
        code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
        if (!(await store.exists(code))) break;
      }
      const { room, player } = createRoom(code, body.name, body.avatar, Date.now());
      await store.set(room);
      return json({ room: sanitize(room), now: Date.now(), you: { id: player.id, token: player.token } });
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
      if (!action || typeof action !== 'object' || typeof action.type !== 'string') throw new GameError('Action invalide.');
      let failure: GameError | null = null;
      const { room } = await withRoom(code, (r, now) => {
        const me = r.players.find((p) => p.id === id);
        if (!me || me.token !== token) throw new GameError('Tu ne fais plus partie de cette partie.');
        advance(r, now);
        try {
          applyAction(r, id, action, now);
        } catch (e) {
          if (e instanceof GameError) failure = e;
          else throw e;
        }
      });
      if (failure) return json({ error: (failure as GameError).message, room: sanitize(room), now: Date.now() }, 409);
      return json({ room: sanitize(room), now: Date.now() });
    }

    return json({ error: 'Opération inconnue.' }, 400);
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown): Response {
  if (e instanceof GameError) return json({ error: e.message }, 400);
  console.error(e);
  return json({ error: 'Oups ! Erreur du serveur.' }, 500);
}
