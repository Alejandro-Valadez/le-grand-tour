// Moteur du jeu — côté serveur uniquement. Toutes les règles vivent ici.
import { BOARD, BOARD_SIZE, cityAt, nextGare } from './board.js';
import { EVENT_CARDS, QUIZ_DECKS, SPEAK_CARDS, TABLE_CARDS } from './cards.js';
import type {
  Action,
  DealtQuiz,
  EventCard,
  Outcome,
  QuizCard,
  QuizCat,
  Room,
  ServerPlayer,
  ServerRoom,
  Turn,
} from './types.js';

export const AVATARS = ['🐓', '🥐', '🗼', '🧀', '🎨', '🚲', '🎩', '🥖', '🐌', '🦊', '🍓', '⛵'];
export const COLORS = ['#D7263D', '#2F6FAE', '#E09A1E', '#3F7D58', '#6D5BA8', '#D9577F'];
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;

export const T = {
  roll: 30_000,
  quiz: 25_000,
  steal: 12_000,
  duelPick: 20_000,
  duelCountdown: 3_000,
  duel: 20_000,
  vote: 20_000,
  speakRead: 8_000,
  tableSpeak: 150_000,
  tableVote: 25_000,
  event: 6_500,
  tgv: 4_500,
  reveal: 10_000,
  moveBase: 500,
  moveStep: 330,
  accuse: 15_000,
  accuseCooldown: 60_000,
};

export const POINTS = { quiz: 1, steal: 1, duel: 2, speakMax: 3, table: 2, lap: 3, english: 1 };

export class GameError extends Error {}

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <X>(xs: X[]): X => xs[rand(xs.length)];
function shuffle<X>(xs: X[]): X[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const uid = (n = 8) => {
  const abc = 'abcdefghijkmnopqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += abc[rand(abc.length)];
  return s;
};
export const newToken = () => globalThis.crypto?.randomUUID?.() ?? `${uid(12)}-${uid(12)}`;

// ─── Création ────────────────────────────────────────────────

export function cleanName(raw: unknown): string {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  if (!s) throw new GameError('Écris ton prénom !');
  return s;
}

function cleanAvatar(raw: unknown): string {
  const s = String(raw ?? '');
  return AVATARS.includes(s) ? s : AVATARS[0];
}

function makePlayer(room: ServerRoom | null, name: string, avatar: string, now: number): ServerPlayer {
  const taken = new Set(room?.players.map((p) => p.color));
  const color = COLORS.find((c) => !taken.has(c)) ?? COLORS[0];
  let finalName = name;
  if (room) {
    let k = 2;
    const names = new Set(room.players.map((p) => p.name.toLowerCase()));
    while (names.has(finalName.toLowerCase())) finalName = `${name} ${k++}`;
  }
  return {
    id: `p${uid(7)}`,
    token: newToken(),
    name: finalName,
    avatar,
    color,
    pos: 0,
    score: 0,
    skip: false,
    stats: { right: 0, wrong: 0, spoke: 0, steals: 0 },
    accuseReadyAt: 0,
    joinedAt: now,
  };
}

export function createRoom(code: string, name: unknown, avatar: unknown, now: number) {
  const host = makePlayer(null, cleanName(name), cleanAvatar(avatar), now);
  const room: ServerRoom = {
    code,
    version: 1,
    createdAt: now,
    hostId: host.id,
    status: 'lobby',
    durationMin: 20,
    startedAt: 0,
    endsAt: 0,
    players: [host],
    turnIndex: 0,
    turnCount: 0,
    turn: null,
    lastMove: null,
    accusation: null,
    lastVerdict: null,
    log: [],
    seq: 1,
    used: {},
  };
  log(room, `${host.name} a ouvert la partie. Bienvenue !`, 'info', now);
  return { room, player: host };
}

export function addPlayer(room: ServerRoom, name: unknown, avatar: unknown, now: number) {
  if (room.status !== 'lobby') throw new GameError('La partie a déjà commencé. Attends la prochaine !');
  if (room.players.length >= MAX_PLAYERS) throw new GameError('La partie est complète (6 joueurs maximum).');
  const p = makePlayer(room, cleanName(name), cleanAvatar(avatar), now);
  room.players.push(p);
  log(room, `${p.name} est arrivé(e) à la gare.`, 'info', now);
  return p;
}

// ─── Aides ───────────────────────────────────────────────────

function log(room: ServerRoom, text: string, tone: 'good' | 'bad' | 'info' = 'info', now = Date.now()) {
  room.log.push({ id: room.seq++, at: now, text, tone });
  if (room.log.length > 40) room.log.splice(0, room.log.length - 40);
}

function player(room: ServerRoom, id: string): ServerPlayer {
  const p = room.players.find((x) => x.id === id);
  if (!p) throw new GameError('Joueur introuvable.');
  return p;
}

const active = (room: ServerRoom) => room.players[room.turnIndex];
const others = (room: ServerRoom, id: string) => room.players.filter((p) => p.id !== id);
const croissants = (n: number) => `${n > 0 ? '+' : ''}${n} 🥐`;

function gain(p: ServerPlayer, n: number) {
  p.score = Math.max(0, p.score + n);
}

function draw<X extends { id: string }>(room: ServerRoom, key: string, deck: X[]): X {
  const used = (room.used[key] ??= []);
  let pool = deck.filter((c) => !used.includes(c.id));
  if (pool.length === 0) {
    room.used[key] = [];
    pool = deck;
  }
  const card = pick(pool);
  room.used[key].push(card.id);
  return card;
}

function deal(card: QuizCard): DealtQuiz {
  const options = shuffle([card.a, ...card.w]);
  return {
    id: card.id,
    cat: card.cat,
    ask: card.ask,
    q: card.q,
    options,
    answer: options.indexOf(card.a),
    x: card.x,
    ...(card.audio ? { audio: card.audio } : {}),
  };
}

/** Avance un pion pas à pas ; renvoie le chemin et donne le bonus de tour complet. */
function walk(room: ServerRoom, p: ServerPlayer, steps: number, now: number): number[] {
  const path: number[] = [];
  const dir = steps >= 0 ? 1 : -1;
  for (let s = 0; s < Math.abs(steps); s++) {
    p.pos = (p.pos + dir + BOARD_SIZE) % BOARD_SIZE;
    path.push(p.pos);
    if (dir > 0 && p.pos === 0) {
      gain(p, POINTS.lap);
      log(room, `${p.name} a fait le tour de France ! ${croissants(POINTS.lap)}`, 'good', now);
    }
  }
  return path;
}

function moveMs(n: number) {
  return n === 0 ? 0 : T.moveBase + n * T.moveStep;
}

// ─── Déroulement d’un tour ───────────────────────────────────

function startTurn(room: ServerRoom, now: number) {
  room.turn = { phase: 'roll', pid: active(room).id, deadline: now + T.roll };
}

function nextTurn(room: ServerRoom, now: number) {
  if (room.status !== 'playing') return;
  if (now >= room.endsAt) return endGame(room, now, 'Le temps est écoulé !');
  const n = room.players.length;
  for (let k = 0; k < n; k++) {
    room.turnIndex = (room.turnIndex + 1) % n;
    const p = active(room);
    if (p.skip) {
      p.skip = false;
      log(room, `${p.name} est coincé(e) dans les bouchons et passe son tour.`, 'bad', now);
      continue;
    }
    break;
  }
  room.turnCount++;
  startTurn(room, now);
}

function endGame(room: ServerRoom, now: number, why: string) {
  room.status = 'ended';
  room.turn = null;
  room.accusation = null;
  const best = Math.max(...room.players.map((p) => p.score));
  const winners = room.players.filter((p) => p.score === best).map((p) => p.name);
  log(room, `${why} Victoire de ${winners.join(' et ')} avec ${best} 🥐 !`, 'good', now);
}

function roll(room: ServerRoom, now: number) {
  const p = active(room);
  const dice = 1 + rand(6);
  log(room, `${p.name} a lancé le dé : ${dice}.`, 'info', now);
  const path = walk(room, p, dice, now);

  if (BOARD[p.pos] === 'gare') {
    const from = p.pos;
    const to = nextGare(from);
    log(room, `🚄 ${p.name} prend le TGV de ${cityAt(from)} à ${cityAt(to)} !`, 'good', now);
    path.push(...walk(room, p, (to - from + BOARD_SIZE) % BOARD_SIZE, now));
    const startsAt = now + moveMs(path.length);
    room.lastMove = { id: room.seq++, pid: p.id, dice, path, at: now };
    room.turn = { phase: 'tgv', pid: p.id, from, to, startsAt, deadline: startsAt + T.tgv };
    return;
  }

  room.lastMove = { id: room.seq++, pid: p.id, dice, path, at: now };
  land(room, p, now + moveMs(path.length), now);
}

function land(room: ServerRoom, p: ServerPlayer, startsAt: number, now: number) {
  const kind = BOARD[p.pos];
  switch (kind) {
    case 'pp':
    case 'etre':
    case 'temps':
    case 'vocab': {
      const card = deal(draw(room, kind, QUIZ_DECKS[kind] as QuizCard[]));
      room.turn = { phase: 'quiz', pid: p.id, card, startsAt, deadline: startsAt + T.quiz };
      return;
    }
    case 'parle': {
      const card = draw(room, 'parle', SPEAK_CARDS);
      room.turn = {
        phase: 'speak',
        pid: p.id,
        card,
        startsAt,
        deadline: startsAt + T.speakRead + card.seconds * 1000,
      };
      return;
    }
    case 'table': {
      const card = draw(room, 'table', TABLE_CARDS);
      room.turn = { phase: 'table_speak', pid: p.id, card, startsAt, deadline: startsAt + T.tableSpeak };
      return;
    }
    case 'duel':
      room.turn = { phase: 'duel_pick', pid: p.id, startsAt, deadline: startsAt + T.duelPick };
      return;
    case 'chance': {
      const card = draw(room, 'chance', EVENT_CARDS);
      room.turn = { phase: 'event', pid: p.id, card, startsAt, deadline: startsAt + T.event };
      return;
    }
    case 'depart':
    case 'gare':
    default:
      nextTurn(room, now);
  }
}

function applyEvent(room: ServerRoom, p: ServerPlayer, card: EventCard, now: number) {
  const e = card.effect;
  switch (e.kind) {
    case 'score':
      gain(p, e.amount);
      log(room, `${card.title} ${p.name} : ${croissants(e.amount)}`, e.amount > 0 ? 'good' : 'bad', now);
      break;
    case 'move': {
      const path = walk(room, p, e.steps, now);
      room.lastMove = { id: room.seq++, pid: p.id, dice: 0, path, at: now };
      log(room, `${card.title} ${p.name} ${e.steps > 0 ? 'avance' : 'recule'} de ${Math.abs(e.steps)} case(s).`, e.steps > 0 ? 'good' : 'bad', now);
      break;
    }
    case 'everyone':
      room.players.forEach((q) => gain(q, e.amount));
      log(room, `${card.title} Tout le monde : ${croissants(e.amount)}`, 'good', now);
      break;
    case 'birthday': {
      let total = 0;
      others(room, p.id).forEach((q) => {
        const give = Math.min(q.score, e.amount);
        q.score -= give;
        total += give;
      });
      gain(p, total);
      log(room, `Joyeux anniversaire, ${p.name} ! ${croissants(total)}`, 'good', now);
      break;
    }
    case 'rob-leader': {
      const leader = [...others(room, p.id)].sort((a, b) => b.score - a.score)[0];
      if (leader && leader.score > p.score && leader.score > 0) {
        const give = Math.min(leader.score, e.amount);
        leader.score -= give;
        gain(p, give);
        log(room, `${p.name} a volé le béret de ${leader.name} ! ${croissants(give)}`, 'good', now);
      } else {
        gain(p, e.amount);
        log(room, `${p.name} est déjà en tête : le béret rapporte ${croissants(e.amount)}`, 'good', now);
      }
      break;
    }
    case 'skip':
      p.skip = true;
      log(room, `${p.name} passera son prochain tour.`, 'bad', now);
      break;
    case 'again':
      log(room, `${p.name} relance le dé !`, 'good', now);
      break;
  }
}

function reveal(room: ServerRoom, pid: string, outcome: Outcome, now: number) {
  room.turn = { phase: 'reveal', pid, outcome, deadline: now + T.reveal };
}

function resolveQuiz(room: ServerRoom, card: DealtQuiz, choice: number, now: number) {
  const p = active(room);
  const correct = choice === card.answer;
  if (correct) {
    gain(p, POINTS.quiz);
    p.stats.right++;
    log(room, `${p.name} a trouvé la bonne réponse ! ${croissants(POINTS.quiz)}`, 'good', now);
    return reveal(room, p.id, { kind: 'quiz', card, choice, correct: true }, now);
  }
  p.stats.wrong++;
  log(room, choice < 0 ? `${p.name} n’a pas répondu à temps…` : `${p.name} s’est trompé(e)…`, 'bad', now);
  room.turn = { phase: 'steal', pid: p.id, card, firstChoice: choice, tried: [], deadline: now + T.steal };
}

function resolveSteal(room: ServerRoom, stealer: ServerPlayer | null, stealChoice: number | undefined, now: number) {
  const t = room.turn;
  if (t?.phase !== 'steal') return;
  if (stealer) {
    gain(stealer, POINTS.steal);
    stealer.stats.steals++;
    log(room, `${stealer.name} a volé la réponse ! ${croissants(POINTS.steal)}`, 'good', now);
  }
  reveal(
    room,
    t.pid,
    {
      kind: 'quiz',
      card: t.card,
      choice: t.firstChoice,
      correct: false,
      ...(stealer ? { stealer: stealer.id, stealChoice } : {}),
    },
    now,
  );
}

function startDuel(room: ServerRoom, opp: ServerPlayer, now: number) {
  const p = active(room);
  const cat: QuizCat = Math.random() < 0.5 ? 'pp' : 'etre';
  const card = deal(draw(room, cat, QUIZ_DECKS[cat] as QuizCard[]));
  const startsAt = now + T.duelCountdown;
  room.turn = { phase: 'duel', pid: p.id, opp: opp.id, card, locked: [], startsAt, deadline: startsAt + T.duel };
  log(room, `⚔️ ${p.name} défie ${opp.name} en duel !`, 'info', now);
}

function resolveDuel(room: ServerRoom, winner: ServerPlayer | null, now: number) {
  const t = room.turn;
  if (t?.phase !== 'duel') return;
  if (winner) {
    gain(winner, POINTS.duel);
    winner.stats.right++;
    log(room, `${winner.name} gagne le duel ! ${croissants(POINTS.duel)}`, 'good', now);
  } else {
    log(room, `Personne ne gagne le duel.`, 'bad', now);
  }
  reveal(room, t.pid, { kind: 'duel', card: t.card, opp: t.opp, ...(winner ? { winner: winner.id } : {}) }, now);
}

function resolveSpeak(room: ServerRoom, now: number) {
  const t = room.turn;
  if (t?.phase !== 'vote') return;
  const p = player(room, t.pid);
  const values = Object.values(t.votes);
  const yes = values.filter(Boolean).length;
  const no = values.length - yes;
  const gained = Math.min(POINTS.speakMax, yes);
  gain(p, gained);
  p.stats.spoke++;
  log(room, `${p.name} a parlé : ${yes} bravo${yes > 1 ? 's' : ''} → ${croissants(gained)}`, gained > 0 ? 'good' : 'bad', now);
  reveal(room, t.pid, { kind: 'speak', card: t.card, yes, no, gained }, now);
}

function resolveTable(room: ServerRoom, now: number) {
  const t = room.turn;
  if (t?.phase !== 'table_vote') return;
  const tally: Record<string, number> = {};
  for (const target of Object.values(t.votes)) tally[target] = (tally[target] ?? 0) + 1;
  const best = Math.max(0, ...Object.values(tally));
  const winners = best > 0 ? Object.keys(tally).filter((id) => tally[id] === best) : [];
  winners.forEach((id) => {
    const w = room.players.find((q) => q.id === id);
    if (w) {
      gain(w, POINTS.table);
      w.stats.spoke++;
    }
  });
  const names = winners.map((id) => room.players.find((q) => q.id === id)?.name).filter(Boolean);
  log(room, names.length ? `☕ Meilleure réponse : ${names.join(' et ')} ! ${croissants(POINTS.table)}` : '☕ Pas de votes… personne ne gagne.', names.length ? 'good' : 'bad', now);
  reveal(room, t.pid, { kind: 'table', card: t.card, winners, tally }, now);
}

function resolveAccusation(room: ServerRoom, now: number) {
  const a = room.accusation;
  if (!a) return;
  room.accusation = null;
  const target = room.players.find((p) => p.id === a.target);
  const by = room.players.find((p) => p.id === a.by);
  if (!target || !by) return;
  const eligible = room.players.length - 1;
  const yes = Object.values(a.votes).filter(Boolean).length;
  const guilty = yes > eligible / 2;
  if (guilty) {
    gain(target, -POINTS.english);
    log(room, `🚨 Coupable ! ${target.name} a parlé anglais : −${POINTS.english} 🥐`, 'bad', now);
  } else {
    log(room, `✅ Innocent ! ${target.name} a bien parlé français.`, 'good', now);
  }
  room.lastVerdict = { id: a.id, by: a.by, target: a.target, guilty, at: now };
}

// ─── Temps qui passe ─────────────────────────────────────────

/** Résout les délais expirés. Renvoie true si l’état a changé. */
export function advance(room: ServerRoom, now: number): boolean {
  let changed = false;
  if (room.accusation && now >= room.accusation.deadline) {
    resolveAccusation(room, now);
    changed = true;
  }
  for (let guard = 0; guard < 12; guard++) {
    if (room.status !== 'playing' || !room.turn) break;
    const t: Turn = room.turn;
    if (now < t.deadline) break;
    changed = true;
    switch (t.phase) {
      case 'roll':
        roll(room, now);
        break;
      case 'quiz':
        resolveQuiz(room, t.card, -1, now);
        break;
      case 'steal':
        resolveSteal(room, null, undefined, now);
        break;
      case 'duel_pick': {
        const opp = pick(others(room, t.pid));
        startDuel(room, opp, now);
        break;
      }
      case 'duel':
        resolveDuel(room, null, now);
        break;
      case 'speak':
        room.turn = { phase: 'vote', pid: t.pid, card: t.card, votes: {}, deadline: now + T.vote };
        break;
      case 'vote':
        resolveSpeak(room, now);
        break;
      case 'table_speak':
        room.turn = { phase: 'table_vote', pid: t.pid, card: t.card, votes: {}, deadline: now + T.tableVote };
        break;
      case 'table_vote':
        resolveTable(room, now);
        break;
      case 'event': {
        const p = player(room, t.pid);
        applyEvent(room, p, t.card, now);
        if (t.card.effect.kind === 'again') startTurn(room, now);
        else nextTurn(room, now);
        break;
      }
      case 'tgv':
      case 'reveal':
        nextTurn(room, now);
        break;
    }
  }
  if (changed) room.version++;
  return changed;
}

// ─── Actions des joueurs ─────────────────────────────────────

export function applyAction(room: ServerRoom, pid: string, action: Action, now: number) {
  const me = player(room, pid);
  const isHost = room.hostId === pid;
  const t = room.turn;
  const mustHost = () => {
    if (!isHost) throw new GameError('Seul l’hôte peut faire ça.');
  };
  const mustPhase = <P extends Turn['phase']>(phase: P): Extract<Turn, { phase: P }> => {
    if (room.status !== 'playing' || !t || t.phase !== phase) throw new GameError('Trop tard !');
    return t as Extract<Turn, { phase: P }>;
  };
  const mustActive = (turn: Turn) => {
    if (turn.pid !== pid) throw new GameError('Ce n’est pas ton tour.');
  };
  const validChoice = (card: DealtQuiz, c: unknown): number => {
    const n = Number(c);
    if (!Number.isInteger(n) || n < 0 || n >= card.options.length) throw new GameError('Choix invalide.');
    return n;
  };

  switch (action.type) {
    case 'setDuration': {
      mustHost();
      if (room.status !== 'lobby') throw new GameError('La partie a déjà commencé.');
      room.durationMin = clampDuration(action.durationMin);
      break;
    }
    case 'start': {
      mustHost();
      if (room.status !== 'lobby') throw new GameError('La partie a déjà commencé.');
      if (room.players.length < MIN_PLAYERS) throw new GameError('Il faut au moins 2 joueurs.');
      room.durationMin = clampDuration(action.durationMin ?? room.durationMin);
      room.players = shuffle(room.players);
      room.status = 'playing';
      room.startedAt = now;
      room.endsAt = now + room.durationMin * 60_000;
      room.turnIndex = 0;
      room.turnCount = 1;
      log(room, `C’est parti pour ${room.durationMin} minutes ! ${active(room).name} commence.`, 'good', now);
      startTurn(room, now);
      break;
    }
    case 'kick': {
      mustHost();
      if (action.target === room.hostId) throw new GameError('L’hôte ne peut pas partir.');
      const idx = room.players.findIndex((p) => p.id === action.target);
      if (idx < 0) throw new GameError('Joueur introuvable.');
      const [gone] = room.players.splice(idx, 1);
      log(room, `${gone.name} a quitté la partie.`, 'info', now);
      if (room.accusation && (room.accusation.by === gone.id || room.accusation.target === gone.id)) room.accusation = null;
      if (room.accusation) delete room.accusation.votes[gone.id];
      const wasActive = t?.pid === gone.id;
      if (idx < room.turnIndex) room.turnIndex--;
      if (room.status !== 'playing' || room.players.length < MIN_PLAYERS) {
        room.turnIndex = Math.min(room.turnIndex, room.players.length - 1);
        if (room.status === 'playing') endGame(room, now, 'Il ne reste plus assez de joueurs.');
        break;
      }
      const involved = t && ((t.phase === 'duel' && t.opp === gone.id) || wasActive);
      if (involved) {
        room.turnIndex = (room.turnIndex - (wasActive ? 1 : 0) + room.players.length) % room.players.length;
        nextTurn(room, now);
      } else if (t) {
        if (t.phase === 'vote' || t.phase === 'table_vote') {
          delete (t.votes as Record<string, unknown>)[gone.id];
          if (t.phase === 'table_vote') {
            for (const [voter, target] of Object.entries(t.votes)) if (target === gone.id) delete t.votes[voter];
          }
        }
        if (t.phase === 'steal') t.tried = t.tried.filter((id) => id !== gone.id);
      }
      room.turnIndex = Math.min(room.turnIndex, room.players.length - 1);
      break;
    }
    case 'roll': {
      const turn = mustPhase('roll');
      mustActive(turn);
      roll(room, now);
      break;
    }
    case 'answer': {
      const turn = mustPhase('quiz');
      mustActive(turn);
      resolveQuiz(room, turn.card, validChoice(turn.card, action.choice), now);
      break;
    }
    case 'steal': {
      const turn = mustPhase('steal');
      if (turn.pid === pid) throw new GameError('Tu as déjà répondu.');
      if (turn.tried.includes(pid)) throw new GameError('Tu as déjà essayé.');
      const c = validChoice(turn.card, action.choice);
      if (c === turn.card.answer) {
        resolveSteal(room, me, c, now);
      } else {
        turn.tried.push(pid);
        if (turn.tried.length >= others(room, turn.pid).length) resolveSteal(room, null, undefined, now);
      }
      break;
    }
    case 'pickOpponent': {
      const turn = mustPhase('duel_pick');
      mustActive(turn);
      if (action.target === pid) throw new GameError('Choisis un autre joueur.');
      startDuel(room, player(room, action.target), now);
      break;
    }
    case 'duelAnswer': {
      const turn = mustPhase('duel');
      if (pid !== turn.pid && pid !== turn.opp) throw new GameError('Tu n’es pas dans ce duel.');
      if (now < turn.startsAt - 250) throw new GameError('Attends le signal !');
      if (turn.locked.includes(pid)) throw new GameError('Tu as déjà répondu.');
      const c = validChoice(turn.card, action.choice);
      if (c === turn.card.answer) resolveDuel(room, me, now);
      else {
        turn.locked.push(pid);
        if (turn.locked.length >= 2) resolveDuel(room, null, now);
      }
      break;
    }
    case 'doneSpeaking': {
      const turn = mustPhase('speak');
      mustActive(turn);
      room.turn = { phase: 'vote', pid: turn.pid, card: turn.card, votes: {}, deadline: now + T.vote };
      break;
    }
    case 'vote': {
      const turn = mustPhase('vote');
      if (turn.pid === pid) throw new GameError('Tu ne peux pas voter pour toi-même !');
      turn.votes[pid] = !!action.yes;
      if (Object.keys(turn.votes).length >= others(room, turn.pid).length) resolveSpeak(room, now);
      break;
    }
    case 'tableDone': {
      const turn = mustPhase('table_speak');
      if (turn.pid !== pid && !isHost) throw new GameError('Ce n’est pas ton tour.');
      room.turn = { phase: 'table_vote', pid: turn.pid, card: turn.card, votes: {}, deadline: now + T.tableVote };
      break;
    }
    case 'tableVote': {
      const turn = mustPhase('table_vote');
      if (action.target === pid) throw new GameError('Vote pour quelqu’un d’autre !');
      player(room, action.target);
      turn.votes[pid] = action.target;
      if (Object.keys(turn.votes).length >= room.players.length) resolveTable(room, now);
      break;
    }
    case 'continue': {
      const turn = mustPhase('reveal');
      if (turn.pid !== pid && !isHost) throw new GameError('Ce n’est pas ton tour.');
      nextTurn(room, now);
      break;
    }
    case 'accuse': {
      if (room.status !== 'playing') throw new GameError('La partie n’a pas commencé.');
      if (room.accusation) throw new GameError('Un vote est déjà en cours.');
      if (action.target === pid) throw new GameError('Tu ne peux pas t’accuser toi-même !');
      const target = player(room, action.target);
      if (now < me.accuseReadyAt) {
        throw new GameError(`Attends encore ${Math.ceil((me.accuseReadyAt - now) / 1000)} s avant d’accuser.`);
      }
      me.accuseReadyAt = now + T.accuseCooldown;
      room.accusation = { id: room.seq++, by: pid, target: target.id, votes: { [pid]: true }, deadline: now + T.accuse };
      log(room, `🚨 ${me.name} accuse ${target.name} d’avoir parlé anglais !`, 'info', now);
      if (room.players.length - 1 <= 1) resolveAccusation(room, now);
      break;
    }
    case 'accuseVote': {
      const a = room.accusation;
      if (!a) throw new GameError('Pas de vote en cours.');
      if (a.target === pid) throw new GameError('L’accusé(e) ne vote pas !');
      a.votes[pid] = !!action.yes;
      if (Object.keys(a.votes).length >= room.players.length - 1) resolveAccusation(room, now);
      break;
    }
    case 'endNow': {
      mustHost();
      if (room.status !== 'playing') throw new GameError('La partie n’est pas en cours.');
      endGame(room, now, 'L’hôte a terminé la partie.');
      break;
    }
    case 'restart': {
      mustHost();
      if (room.status !== 'ended') throw new GameError('La partie n’est pas terminée.');
      room.status = 'lobby';
      room.turn = null;
      room.lastMove = null;
      room.accusation = null;
      room.lastVerdict = null;
      room.used = {};
      room.log = [];
      room.startedAt = 0;
      room.endsAt = 0;
      room.turnCount = 0;
      room.players.forEach((p) => {
        p.pos = 0;
        p.score = 0;
        p.skip = false;
        p.accuseReadyAt = 0;
        p.stats = { right: 0, wrong: 0, spoke: 0, steals: 0 };
      });
      log(room, 'Nouvelle partie ! Tout le monde revient au départ.', 'info', now);
      break;
    }
    default:
      throw new GameError('Action inconnue.');
  }
  room.version++;
}

function clampDuration(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 20;
  return Math.min(60, Math.max(5, v));
}

// ─── Vue client ──────────────────────────────────────────────

function hide(card: DealtQuiz): DealtQuiz {
  return { ...card, answer: -1, x: '' };
}

/** Retire les secrets (jetons, réponses non révélées) avant d’envoyer au client. */
export function sanitize(room: ServerRoom): Room {
  const { used: _used, ...rest } = room;
  const players = room.players.map(({ token: _t, ...p }) => p);
  let turn = room.turn;
  if (turn && (turn.phase === 'quiz' || turn.phase === 'steal' || turn.phase === 'duel')) {
    turn = { ...turn, card: hide(turn.card) };
  }
  return { ...rest, players, turn };
}
