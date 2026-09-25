// Moteur du jeu — côté serveur uniquement. Toutes les règles vivent ici.
// Trois modes : « plateau » (le Grand Tour), « combat » (jeu de combat) et « sprint » (course de vitesse).
import { BOARD, BOARD_SIZE, cityAt, nextGare } from './board.js';
import { EVENT_CARDS, QUIZ_DECKS, SPEAK_CARDS, TABLE_CARDS } from './cards.js';
import type {
  Action,
  DealtQuiz,
  EventCard,
  Fighter,
  Mode,
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

export const MODES: Mode[] = ['plateau', 'combat', 'sprint'];
export const DURATIONS: Record<Mode, number[]> = {
  plateau: [1, 2, 5, 10, 20],
  combat: [1, 2, 3],
  sprint: [1, 2, 5],
};
export const DEFAULT_DURATION: Record<Mode, number> = { plateau: 5, combat: 2, sprint: 2 };

/** Délais du plateau (en ms). */
export const T = {
  roll: 30_000,
  quiz: 25_000,
  steal: 12_000,
  duelPick: 20_000,
  duelCountdown: 3_000,
  duel: 20_000,
  vote: 20_000,
  speakRead: 8_000,
  speakSeconds: 0, // 0 = durée de la carte
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

/** Délais « éclair » pour les parties de 1 ou 2 minutes. */
export const FAST: typeof T = {
  ...T,
  roll: 10_000,
  quiz: 12_000,
  steal: 6_000,
  duelPick: 8_000,
  duelCountdown: 2_000,
  duel: 10_000,
  vote: 10_000,
  speakRead: 3_000,
  speakSeconds: 20,
  tableSpeak: 45_000,
  tableVote: 12_000,
  event: 3_500,
  tgv: 3_000,
  reveal: 4_500,
  accuse: 12_000,
  accuseCooldown: 30_000,
};

export const isFast = (durationMin: number) => durationMin <= 2;
export const timersFor = (durationMin: number) => (isFast(durationMin) ? FAST : T);

export const POINTS = { quiz: 1, steal: 1, duel: 2, speakMax: 3, table: 2, lap: 3, english: 1 };

export const COMBAT = {
  hp: 100,
  base: 10,
  comboStep: 2,
  comboMax: 5,
  speedBonus: 4,
  speedMs: 3_000,
  missDmg: 5,
  stunMs: 1_500,
  countdown: 3_500,
};

export const SPRINT = { question: 10_000, reveal: 3_000, countdown: 3_500, first: 3, other: 1 };

export class GameError extends Error {
  constructor(
    message: string,
    public en: string,
  ) {
    super(message);
  }
}

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
  if (!s) throw new GameError('Écris ton prénom !', 'Type your first name!');
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
    mode: 'plateau',
    durationMin: DEFAULT_DURATION.plateau,
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
    combat: null,
    sprint: null,
    used: {},
  };
  log(room, now, 'info', `${host.name} a ouvert la partie. Bienvenue !`, `${host.name} opened the game. Welcome!`);
  return { room, player: host };
}

export function addPlayer(room: ServerRoom, name: unknown, avatar: unknown, now: number) {
  if (room.status !== 'lobby') throw new GameError('La partie a déjà commencé. Attends la prochaine !', 'The game has already started. Wait for the next one!');
  if (room.players.length >= MAX_PLAYERS) throw new GameError('La partie est complète (6 joueurs maximum).', 'The game is full (6 players max).');
  const p = makePlayer(room, cleanName(name), cleanAvatar(avatar), now);
  room.players.push(p);
  log(room, now, 'info', `${p.name} est arrivé(e) à la gare.`, `${p.name} arrived at the station.`);
  return p;
}

// ─── Aides ───────────────────────────────────────────────────

function log(room: ServerRoom, now: number, tone: 'good' | 'bad' | 'info', text: string, en: string) {
  room.log.push({ id: room.seq++, at: now, text, en, tone });
  if (room.log.length > 40) room.log.splice(0, room.log.length - 40);
}

function player(room: ServerRoom, id: string): ServerPlayer {
  const p = room.players.find((x) => x.id === id);
  if (!p) throw new GameError('Joueur introuvable.', 'Player not found.');
  return p;
}

const tm = (room: ServerRoom) => timersFor(room.durationMin);
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
    en: { ...card.en },
  };
}

/** Cartes des modes rapides : pas de cartes d'écoute (trop de bruit si tout le monde joue en même temps). */
const RAPID_DECK: QuizCard[] = (Object.values(QUIZ_DECKS) as QuizCard[][]).flat().filter((c) => !c.audio);

/** Avance un pion pas à pas ; renvoie le chemin et donne le bonus de tour complet. */
function walk(room: ServerRoom, p: ServerPlayer, steps: number, now: number): number[] {
  const path: number[] = [];
  const dir = steps >= 0 ? 1 : -1;
  for (let s = 0; s < Math.abs(steps); s++) {
    p.pos = (p.pos + dir + BOARD_SIZE) % BOARD_SIZE;
    path.push(p.pos);
    if (dir > 0 && p.pos === 0) {
      gain(p, POINTS.lap);
      log(room, now, 'good', `${p.name} a fait le tour de France ! ${croissants(POINTS.lap)}`, `${p.name} made it all the way around France! ${croissants(POINTS.lap)}`);
    }
  }
  return path;
}

function moveMs(n: number) {
  return n === 0 ? 0 : T.moveBase + n * T.moveStep;
}

// ─── Fin de partie ───────────────────────────────────────────

function endGame(room: ServerRoom, now: number, why: [string, string]) {
  room.status = 'ended';
  room.turn = null;
  room.accusation = null;
  if (room.mode === 'combat' && room.combat) {
    const fs = room.combat.fighters;
    const alive = room.players.filter((p) => fs[p.id] && fs[p.id].koAt === 0);
    const pool = alive.length ? alive : room.players.filter((p) => fs[p.id]);
    const best = Math.max(...pool.map((p) => fs[p.id].hp));
    const winners = pool.filter((p) => fs[p.id].hp === best);
    room.combat.winners = winners.map((p) => p.id);
    const names = winners.map((p) => p.name).join(' & ');
    log(room, now, 'good', `${why[0]} ${names} remporte le combat !`, `${why[1]} ${names} wins the fight!`);
    return;
  }
  const best = Math.max(...room.players.map((p) => p.score));
  const names = room.players.filter((p) => p.score === best).map((p) => p.name);
  const unit = room.mode === 'sprint' ? 'pts' : '🥐';
  log(room, now, 'good', `${why[0]} Victoire de ${names.join(' et ')} avec ${best} ${unit} !`, `${why[1]} ${names.join(' and ')} wins with ${best} ${unit}!`);
}

const TIME_UP: [string, string] = ['Le temps est écoulé !', 'Time’s up!'];

// ─── Plateau : déroulement d’un tour ─────────────────────────

function startTurn(room: ServerRoom, now: number) {
  room.turn = { phase: 'roll', pid: active(room).id, deadline: now + tm(room).roll };
}

function nextTurn(room: ServerRoom, now: number) {
  if (room.status !== 'playing') return;
  if (now >= room.endsAt) return endGame(room, now, TIME_UP);
  const n = room.players.length;
  for (let k = 0; k < n; k++) {
    room.turnIndex = (room.turnIndex + 1) % n;
    const p = active(room);
    if (p.skip) {
      p.skip = false;
      log(room, now, 'bad', `${p.name} est coincé(e) dans les bouchons et passe son tour.`, `${p.name} is stuck in traffic and skips a turn.`);
      continue;
    }
    break;
  }
  room.turnCount++;
  startTurn(room, now);
}

function roll(room: ServerRoom, now: number) {
  const p = active(room);
  const dice = 1 + rand(6);
  log(room, now, 'info', `${p.name} a lancé le dé : ${dice}.`, `${p.name} rolled a ${dice}.`);
  const path = walk(room, p, dice, now);

  if (BOARD[p.pos] === 'gare') {
    const from = p.pos;
    const to = nextGare(from);
    log(room, now, 'good', `🚄 ${p.name} prend le TGV de ${cityAt(from)} à ${cityAt(to)} !`, `🚄 ${p.name} takes the TGV from ${cityAt(from)} to ${cityAt(to)}!`);
    path.push(...walk(room, p, (to - from + BOARD_SIZE) % BOARD_SIZE, now));
    const startsAt = now + moveMs(path.length);
    room.lastMove = { id: room.seq++, pid: p.id, dice, path, at: now };
    room.turn = { phase: 'tgv', pid: p.id, from, to, startsAt, deadline: startsAt + tm(room).tgv };
    return;
  }

  room.lastMove = { id: room.seq++, pid: p.id, dice, path, at: now };
  land(room, p, now + moveMs(path.length), now);
}

function land(room: ServerRoom, p: ServerPlayer, startsAt: number, now: number) {
  const kind = BOARD[p.pos];
  const t = tm(room);
  switch (kind) {
    case 'pp':
    case 'etre':
    case 'temps':
    case 'vocab': {
      const card = deal(draw(room, kind, QUIZ_DECKS[kind] as QuizCard[]));
      room.turn = { phase: 'quiz', pid: p.id, card, startsAt, deadline: startsAt + t.quiz };
      return;
    }
    case 'parle': {
      const card = draw(room, 'parle', SPEAK_CARDS);
      const secs = t.speakSeconds || card.seconds;
      room.turn = { phase: 'speak', pid: p.id, card: { ...card, seconds: secs }, startsAt, deadline: startsAt + t.speakRead + secs * 1000 };
      return;
    }
    case 'table': {
      const card = draw(room, 'table', TABLE_CARDS);
      room.turn = { phase: 'table_speak', pid: p.id, card, startsAt, deadline: startsAt + t.tableSpeak };
      return;
    }
    case 'duel':
      room.turn = { phase: 'duel_pick', pid: p.id, startsAt, deadline: startsAt + t.duelPick };
      return;
    case 'chance': {
      const card = draw(room, 'chance', EVENT_CARDS);
      room.turn = { phase: 'event', pid: p.id, card, startsAt, deadline: startsAt + t.event };
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
      log(room, now, e.amount > 0 ? 'good' : 'bad', `${card.title} ${p.name} : ${croissants(e.amount)}`, `${card.en.title} ${p.name}: ${croissants(e.amount)}`);
      break;
    case 'move': {
      const path = walk(room, p, e.steps, now);
      room.lastMove = { id: room.seq++, pid: p.id, dice: 0, path, at: now };
      const n = Math.abs(e.steps);
      log(
        room,
        now,
        e.steps > 0 ? 'good' : 'bad',
        `${card.title} ${p.name} ${e.steps > 0 ? 'avance' : 'recule'} de ${n} case${n > 1 ? 's' : ''}.`,
        `${card.en.title} ${p.name} moves ${e.steps > 0 ? 'forward' : 'back'} ${n} space${n > 1 ? 's' : ''}.`,
      );
      break;
    }
    case 'everyone':
      room.players.forEach((q) => gain(q, e.amount));
      log(room, now, 'good', `${card.title} Tout le monde : ${croissants(e.amount)}`, `${card.en.title} Everyone: ${croissants(e.amount)}`);
      break;
    case 'birthday': {
      let total = 0;
      others(room, p.id).forEach((q) => {
        const give = Math.min(q.score, e.amount);
        q.score -= give;
        total += give;
      });
      gain(p, total);
      log(room, now, 'good', `Joyeux anniversaire, ${p.name} ! ${croissants(total)}`, `Happy birthday, ${p.name}! ${croissants(total)}`);
      break;
    }
    case 'rob-leader': {
      const leader = [...others(room, p.id)].sort((a, b) => b.score - a.score)[0];
      if (leader && leader.score > p.score && leader.score > 0) {
        const give = Math.min(leader.score, e.amount);
        leader.score -= give;
        gain(p, give);
        log(room, now, 'good', `${p.name} a volé le béret de ${leader.name} ! ${croissants(give)}`, `${p.name} stole ${leader.name}’s beret! ${croissants(give)}`);
      } else {
        gain(p, e.amount);
        log(room, now, 'good', `${p.name} est déjà en tête : le béret rapporte ${croissants(e.amount)}`, `${p.name} is already in the lead: the beret is worth ${croissants(e.amount)}`);
      }
      break;
    }
    case 'skip':
      p.skip = true;
      log(room, now, 'bad', `${p.name} passera son prochain tour.`, `${p.name} will skip their next turn.`);
      break;
    case 'again':
      log(room, now, 'good', `${p.name} relance le dé !`, `${p.name} rolls again!`);
      break;
  }
}

function reveal(room: ServerRoom, pid: string, outcome: Outcome, now: number) {
  room.turn = { phase: 'reveal', pid, outcome, deadline: now + tm(room).reveal };
}

function resolveQuiz(room: ServerRoom, card: DealtQuiz, choice: number, now: number) {
  const p = active(room);
  const correct = choice === card.answer;
  if (correct) {
    gain(p, POINTS.quiz);
    p.stats.right++;
    log(room, now, 'good', `${p.name} a trouvé la bonne réponse ! ${croissants(POINTS.quiz)}`, `${p.name} got the right answer! ${croissants(POINTS.quiz)}`);
    return reveal(room, p.id, { kind: 'quiz', card, choice, correct: true }, now);
  }
  p.stats.wrong++;
  if (choice < 0) log(room, now, 'bad', `${p.name} n’a pas répondu à temps…`, `${p.name} didn’t answer in time…`);
  else log(room, now, 'bad', `${p.name} s’est trompé(e)…`, `${p.name} got it wrong…`);
  room.turn = { phase: 'steal', pid: p.id, card, firstChoice: choice, tried: [], deadline: now + tm(room).steal };
}

function resolveSteal(room: ServerRoom, stealer: ServerPlayer | null, stealChoice: number | undefined, now: number) {
  const t = room.turn;
  if (t?.phase !== 'steal') return;
  if (stealer) {
    gain(stealer, POINTS.steal);
    stealer.stats.steals++;
    log(room, now, 'good', `${stealer.name} a volé la réponse ! ${croissants(POINTS.steal)}`, `${stealer.name} stole the answer! ${croissants(POINTS.steal)}`);
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
  const t = tm(room);
  const startsAt = now + t.duelCountdown;
  room.turn = { phase: 'duel', pid: p.id, opp: opp.id, card, locked: [], startsAt, deadline: startsAt + t.duel };
  log(room, now, 'info', `⚔️ ${p.name} défie ${opp.name} en duel !`, `⚔️ ${p.name} challenges ${opp.name} to a duel!`);
}

function resolveDuel(room: ServerRoom, winner: ServerPlayer | null, now: number) {
  const t = room.turn;
  if (t?.phase !== 'duel') return;
  if (winner) {
    gain(winner, POINTS.duel);
    winner.stats.right++;
    log(room, now, 'good', `${winner.name} gagne le duel ! ${croissants(POINTS.duel)}`, `${winner.name} wins the duel! ${croissants(POINTS.duel)}`);
  } else {
    log(room, now, 'bad', 'Personne ne gagne le duel.', 'Nobody wins the duel.');
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
  log(
    room,
    now,
    gained > 0 ? 'good' : 'bad',
    `${p.name} a parlé : ${yes} bravo${yes > 1 ? 's' : ''} → ${croissants(gained)}`,
    `${p.name} spoke: ${yes} bravo${yes === 1 ? '' : 's'} → ${croissants(gained)}`,
  );
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
  if (names.length) {
    log(room, now, 'good', `☕ Meilleure réponse : ${names.join(' et ')} ! ${croissants(POINTS.table)}`, `☕ Best answer: ${names.join(' and ')}! ${croissants(POINTS.table)}`);
  } else {
    log(room, now, 'bad', '☕ Pas de votes… personne ne gagne.', '☕ No votes… nobody wins.');
  }
  reveal(room, t.pid, { kind: 'table', card: t.card, winners, tally }, now);
}

// ─── « Anglais ! » (tous les modes) ──────────────────────────

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
    if (room.mode === 'combat' && room.combat?.fighters[target.id]) {
      const f = room.combat.fighters[target.id];
      f.hp = Math.max(1, f.hp - 10);
      f.lastHit = { id: room.seq++, by: by.id, dmg: 10, at: now };
      log(room, now, 'bad', `🚨 Coupable ! ${target.name} a parlé anglais : −10 PV`, `🚨 Guilty! ${target.name} spoke English: −10 HP`);
    } else {
      gain(target, -POINTS.english);
      log(room, now, 'bad', `🚨 Coupable ! ${target.name} a parlé anglais : −${POINTS.english} 🥐`, `🚨 Guilty! ${target.name} spoke English: −${POINTS.english} 🥐`);
    }
  } else {
    log(room, now, 'good', `✅ Innocent ! ${target.name} a bien parlé français.`, `✅ Not guilty! ${target.name} really did speak French.`);
  }
  room.lastVerdict = { id: a.id, by: a.by, target: a.target, guilty, at: now };
}

// ─── Combat ──────────────────────────────────────────────────

function newFighter(room: ServerRoom, pid: string, at: number): Fighter {
  return {
    hp: COMBAT.hp,
    combo: 0,
    bestCombo: 0,
    target: null,
    q: deal(draw(room, `f:${pid}`, RAPID_DECK)),
    qAt: at,
    stunUntil: 0,
    hits: 0,
    misses: 0,
    dmg: 0,
    kos: 0,
    koAt: 0,
    lastHit: null,
    lastResult: null,
  };
}

const aliveIds = (room: ServerRoom) =>
  room.players.filter((p) => room.combat?.fighters[p.id] && room.combat.fighters[p.id].koAt === 0).map((p) => p.id);

/** Cible : celle choisie si elle est encore debout, sinon l'adversaire qui a le plus de PV. */
function targetOf(room: ServerRoom, pid: string): string | null {
  const fs = room.combat!.fighters;
  const me = fs[pid];
  if (me.target && me.target !== pid && fs[me.target]?.koAt === 0) return me.target;
  const opp = aliveIds(room).filter((id) => id !== pid);
  if (!opp.length) return null;
  return opp.sort((a, b) => fs[b].hp - fs[a].hp)[0];
}

export function damageFor(combo: number, fastAnswer: boolean) {
  return COMBAT.base + Math.min(combo, COMBAT.comboMax) * COMBAT.comboStep + (fastAnswer ? COMBAT.speedBonus : 0);
}

function fight(room: ServerRoom, me: ServerPlayer, choice: number, now: number) {
  const c = room.combat!;
  const f = c.fighters[me.id];
  if (!f) throw new GameError('Tu ne combats pas.', 'You’re not in this fight.');
  if (f.koAt) throw new GameError('Tu es K.O. !', 'You’re knocked out!');
  if (now < c.startsAt - 200) throw new GameError('Attends le signal !', 'Wait for the signal!');
  if (now < f.stunUntil - 100) throw new GameError('Tu es étourdi(e) !', 'You’re stunned!');
  const card = f.q;
  const ok = choice === card.answer;
  let dmg = 0;
  if (ok) {
    const tid = targetOf(room, me.id);
    dmg = damageFor(f.combo, now - f.qAt <= COMBAT.speedMs);
    f.combo++;
    f.bestCombo = Math.max(f.bestCombo, f.combo);
    f.hits++;
    me.stats.right++;
    if (tid) {
      const t = c.fighters[tid];
      const target = player(room, tid);
      t.hp = Math.max(0, t.hp - dmg);
      t.lastHit = { id: room.seq++, by: me.id, dmg, at: now };
      f.dmg += dmg;
      if (f.combo === COMBAT.comboMax) log(room, now, 'good', `🔥 SUPER COMBO de ${me.name} !`, `🔥 SUPER COMBO by ${me.name}!`);
      if (t.hp === 0) {
        t.koAt = now;
        f.kos++;
        log(room, now, 'good', `💥 K.O. ! ${me.name} met ${target.name} au tapis !`, `💥 K.O.! ${me.name} knocks out ${target.name}!`);
      }
    }
  } else {
    f.combo = 0;
    f.misses++;
    me.stats.wrong++;
    dmg = COMBAT.missDmg;
    f.hp = Math.max(1, f.hp - dmg);
    f.lastHit = { id: room.seq++, by: me.id, dmg, at: now };
    f.stunUntil = now + COMBAT.stunMs;
  }
  f.lastResult = { id: room.seq++, ok, dmg, choice, card, at: now };
  f.q = deal(draw(room, `f:${me.id}`, RAPID_DECK));
  f.qAt = ok ? now : f.stunUntil;
  if (aliveIds(room).length <= 1) endGame(room, now, ['K.O. !', 'K.O.!']);
}

// ─── Sprint ──────────────────────────────────────────────────

function sprintQuestion(room: ServerRoom, at: number) {
  const s = room.sprint!;
  s.round++;
  s.q = deal(draw(room, 'sprint', RAPID_DECK));
  s.qAt = at;
  s.deadline = at + SPRINT.question;
  s.answers = {};
  s.revealUntil = 0;
  s.firstId = null;
}

function closeSprint(room: ServerRoom, now: number) {
  const s = room.sprint!;
  s.revealUntil = now + SPRINT.reveal;
  const first = room.players.find((p) => p.id === s.firstId);
  if (first) log(room, now, 'good', `⚡ ${first.name} a été le plus rapide ! +${SPRINT.first} pts`, `⚡ ${first.name} was the fastest! +${SPRINT.first} pts`);
  else log(room, now, 'bad', '⚡ Personne n’a trouvé…', '⚡ Nobody got it…');
}

function sprintAnswer(room: ServerRoom, me: ServerPlayer, choice: number, now: number) {
  const s = room.sprint!;
  if (s.revealUntil) throw new GameError('Trop tard !', 'Too late!');
  if (now < s.qAt - 200) throw new GameError('Attends le signal !', 'Wait for the signal!');
  if (s.answers[me.id]) throw new GameError('Tu as déjà répondu.', 'You already answered.');
  const ok = choice === s.q.answer;
  let pts = 0;
  if (ok) {
    pts = s.firstId ? SPRINT.other : SPRINT.first;
    if (!s.firstId) s.firstId = me.id;
    me.stats.right++;
  } else {
    me.stats.wrong++;
  }
  me.score += pts;
  s.answers[me.id] = { choice, at: now, ok, pts };
  if (Object.keys(s.answers).length >= room.players.length) closeSprint(room, now);
}

// ─── Temps qui passe ─────────────────────────────────────────

/** Résout les délais expirés. Renvoie true si l’état a changé. */
export function advance(room: ServerRoom, now: number): boolean {
  let changed = false;
  if (room.accusation && now >= room.accusation.deadline) {
    resolveAccusation(room, now);
    changed = true;
  }
  if (room.status !== 'playing') {
    if (changed) room.version++;
    return changed;
  }

  if (room.mode === 'combat') {
    if (now >= room.endsAt) {
      endGame(room, now, TIME_UP);
      changed = true;
    }
  } else if (room.mode === 'sprint') {
    const s = room.sprint!;
    for (let guard = 0; guard < 4 && room.status === 'playing'; guard++) {
      if (!s.revealUntil && now >= s.deadline) {
        closeSprint(room, now);
        changed = true;
      } else if (s.revealUntil && now >= s.revealUntil) {
        if (now >= room.endsAt) endGame(room, now, TIME_UP);
        else sprintQuestion(room, now);
        changed = true;
      } else break;
    }
  } else {
    // Parties éclair : on s'arrête pile à l'heure. Sinon on finit le tour (au plus 30 s de plus).
    if (now >= room.endsAt + (isFast(room.durationMin) ? 0 : 30_000)) {
      endGame(room, now, TIME_UP);
      changed = true;
    }
    for (let guard = 0; guard < 12; guard++) {
      if (room.status !== 'playing' || !room.turn) break;
      const t: Turn = room.turn;
      if (now < t.deadline) break;
      changed = true;
      const tt = tm(room);
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
        case 'duel_pick':
          startDuel(room, pick(others(room, t.pid)), now);
          break;
        case 'duel':
          resolveDuel(room, null, now);
          break;
        case 'speak':
          room.turn = { phase: 'vote', pid: t.pid, card: t.card, votes: {}, deadline: now + tt.vote };
          break;
        case 'vote':
          resolveSpeak(room, now);
          break;
        case 'table_speak':
          room.turn = { phase: 'table_vote', pid: t.pid, card: t.card, votes: {}, deadline: now + tt.tableVote };
          break;
        case 'table_vote':
          resolveTable(room, now);
          break;
        case 'event': {
          applyEvent(room, player(room, t.pid), t.card, now);
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
  }
  if (changed) room.version++;
  return changed;
}

// ─── Actions des joueurs ─────────────────────────────────────

const ERR = {
  host: ['Seul l’hôte peut faire ça.', 'Only the host can do that.'],
  late: ['Trop tard !', 'Too late!'],
  notYou: ['Ce n’est pas ton tour.', 'It’s not your turn.'],
  choice: ['Choix invalide.', 'Invalid choice.'],
  started: ['La partie a déjà commencé.', 'The game has already started.'],
  mode: ['Ce n’est pas le bon mode de jeu.', 'That’s not available in this game mode.'],
} as const;
const fail = (e: readonly [string, string]) => new GameError(e[0], e[1]);

export function applyAction(room: ServerRoom, pid: string, action: Action, now: number) {
  const me = player(room, pid);
  const isHost = room.hostId === pid;
  const t = room.turn;
  const mustHost = () => {
    if (!isHost) throw fail(ERR.host);
  };
  const mustMode = (m: Mode) => {
    if (room.status !== 'playing') throw fail(ERR.late);
    if (room.mode !== m) throw fail(ERR.mode);
  };
  const mustPhase = <P extends Turn['phase']>(phase: P): Extract<Turn, { phase: P }> => {
    if (room.status !== 'playing' || room.mode !== 'plateau' || !t || t.phase !== phase) throw fail(ERR.late);
    return t as Extract<Turn, { phase: P }>;
  };
  const mustActive = (turn: Turn) => {
    if (turn.pid !== pid) throw fail(ERR.notYou);
  };
  const validChoice = (card: DealtQuiz, c: unknown): number => {
    const n = Number(c);
    if (!Number.isInteger(n) || n < 0 || n >= card.options.length) throw fail(ERR.choice);
    return n;
  };

  switch (action.type) {
    case 'setMode': {
      mustHost();
      if (room.status !== 'lobby') throw fail(ERR.started);
      if (!MODES.includes(action.mode)) throw fail(ERR.mode);
      room.mode = action.mode;
      if (!DURATIONS[room.mode].includes(room.durationMin)) room.durationMin = DEFAULT_DURATION[room.mode];
      break;
    }
    case 'setDuration': {
      mustHost();
      if (room.status !== 'lobby') throw fail(ERR.started);
      room.durationMin = clampDuration(room.mode, action.durationMin);
      break;
    }
    case 'start': {
      mustHost();
      if (room.status !== 'lobby') throw fail(ERR.started);
      if (room.players.length < MIN_PLAYERS) throw new GameError('Il faut au moins 2 joueurs.', 'You need at least 2 players.');
      room.durationMin = clampDuration(room.mode, action.durationMin ?? room.durationMin);
      room.players = shuffle(room.players);
      room.status = 'playing';
      room.startedAt = now;
      const m = room.durationMin;
      if (room.mode === 'combat') {
        const startsAt = now + COMBAT.countdown;
        room.combat = { startsAt, fighters: {}, winners: [] };
        for (const p of room.players) room.combat.fighters[p.id] = newFighter(room, p.id, startsAt);
        room.endsAt = startsAt + m * 60_000;
        log(room, now, 'good', `🥊 Combat de ${m} minute${m > 1 ? 's' : ''} ! Préparez-vous…`, `🥊 ${m}-minute fight! Get ready…`);
      } else if (room.mode === 'sprint') {
        const startsAt = now + SPRINT.countdown;
        room.sprint = { startsAt, round: 0, q: deal(RAPID_DECK[0]), qAt: 0, deadline: 0, answers: {}, revealUntil: 0, firstId: null };
        sprintQuestion(room, startsAt);
        room.endsAt = startsAt + m * 60_000;
        log(room, now, 'good', `⚡ Sprint de ${m} minute${m > 1 ? 's' : ''} ! Préparez-vous…`, `⚡ ${m}-minute sprint! Get ready…`);
      } else {
        room.endsAt = now + m * 60_000;
        room.turnIndex = 0;
        room.turnCount = 1;
        log(room, now, 'good', `C’est parti pour ${m} minute${m > 1 ? 's' : ''} ! ${active(room).name} commence.`, `Here we go: ${m} minute${m > 1 ? 's' : ''}! ${active(room).name} goes first.`);
        startTurn(room, now);
      }
      break;
    }
    case 'kick': {
      mustHost();
      if (action.target === room.hostId) throw new GameError('L’hôte ne peut pas partir.', 'The host can’t be removed.');
      const idx = room.players.findIndex((p) => p.id === action.target);
      if (idx < 0) throw new GameError('Joueur introuvable.', 'Player not found.');
      const [gone] = room.players.splice(idx, 1);
      log(room, now, 'info', `${gone.name} a quitté la partie.`, `${gone.name} left the game.`);
      if (room.accusation && (room.accusation.by === gone.id || room.accusation.target === gone.id)) room.accusation = null;
      if (room.accusation) delete room.accusation.votes[gone.id];
      if (room.combat) {
        delete room.combat.fighters[gone.id];
        for (const f of Object.values(room.combat.fighters)) if (f.target === gone.id) f.target = null;
      }
      if (room.sprint) delete room.sprint.answers[gone.id];
      const wasActive = t?.pid === gone.id;
      if (idx < room.turnIndex) room.turnIndex--;
      if (room.status !== 'playing' || room.players.length < MIN_PLAYERS || (room.mode === 'combat' && aliveIds(room).length <= 1)) {
        room.turnIndex = Math.min(room.turnIndex, room.players.length - 1);
        if (room.status === 'playing') endGame(room, now, ['Il ne reste plus assez de joueurs.', 'Not enough players left.']);
        break;
      }
      if (room.mode === 'plateau') {
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
      }
      room.turnIndex = Math.min(room.turnIndex, room.players.length - 1);
      break;
    }
    case 'fight': {
      mustMode('combat');
      const f = room.combat!.fighters[pid];
      if (!f) throw new GameError('Tu ne combats pas.', 'You’re not in this fight.');
      fight(room, me, validChoice(f.q, action.choice), now);
      break;
    }
    case 'target': {
      mustMode('combat');
      const fs = room.combat!.fighters;
      if (action.target === pid || !fs[action.target] || fs[action.target].koAt) {
        throw new GameError('Choisis un adversaire encore debout.', 'Pick an opponent who is still standing.');
      }
      fs[pid].target = action.target;
      break;
    }
    case 'sprintAnswer': {
      mustMode('sprint');
      sprintAnswer(room, me, validChoice(room.sprint!.q, action.choice), now);
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
      if (turn.pid === pid) throw new GameError('Tu as déjà répondu.', 'You already answered.');
      if (turn.tried.includes(pid)) throw new GameError('Tu as déjà essayé.', 'You already tried.');
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
      if (action.target === pid) throw new GameError('Choisis un autre joueur.', 'Pick another player.');
      startDuel(room, player(room, action.target), now);
      break;
    }
    case 'duelAnswer': {
      const turn = mustPhase('duel');
      if (pid !== turn.pid && pid !== turn.opp) throw new GameError('Tu n’es pas dans ce duel.', 'You’re not in this duel.');
      if (now < turn.startsAt - 250) throw new GameError('Attends le signal !', 'Wait for the signal!');
      if (turn.locked.includes(pid)) throw new GameError('Tu as déjà répondu.', 'You already answered.');
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
      room.turn = { phase: 'vote', pid: turn.pid, card: turn.card, votes: {}, deadline: now + tm(room).vote };
      break;
    }
    case 'vote': {
      const turn = mustPhase('vote');
      if (turn.pid === pid) throw new GameError('Tu ne peux pas voter pour toi-même !', 'You can’t vote for yourself!');
      turn.votes[pid] = !!action.yes;
      if (Object.keys(turn.votes).length >= others(room, turn.pid).length) resolveSpeak(room, now);
      break;
    }
    case 'tableDone': {
      const turn = mustPhase('table_speak');
      if (turn.pid !== pid && !isHost) throw fail(ERR.notYou);
      room.turn = { phase: 'table_vote', pid: turn.pid, card: turn.card, votes: {}, deadline: now + tm(room).tableVote };
      break;
    }
    case 'tableVote': {
      const turn = mustPhase('table_vote');
      if (action.target === pid) throw new GameError('Vote pour quelqu’un d’autre !', 'Vote for someone else!');
      player(room, action.target);
      turn.votes[pid] = action.target;
      if (Object.keys(turn.votes).length >= room.players.length) resolveTable(room, now);
      break;
    }
    case 'continue': {
      const turn = mustPhase('reveal');
      if (turn.pid !== pid && !isHost) throw fail(ERR.notYou);
      nextTurn(room, now);
      break;
    }
    case 'accuse': {
      if (room.status !== 'playing') throw new GameError('La partie n’a pas commencé.', 'The game hasn’t started.');
      if (room.accusation) throw new GameError('Un vote est déjà en cours.', 'A vote is already happening.');
      if (action.target === pid) throw new GameError('Tu ne peux pas t’accuser toi-même !', 'You can’t accuse yourself!');
      const target = player(room, action.target);
      if (now < me.accuseReadyAt) {
        const s = Math.ceil((me.accuseReadyAt - now) / 1000);
        throw new GameError(`Attends encore ${s} s avant d’accuser.`, `Wait ${s} more seconds before accusing someone.`);
      }
      const tt = tm(room);
      me.accuseReadyAt = now + tt.accuseCooldown;
      room.accusation = { id: room.seq++, by: pid, target: target.id, votes: { [pid]: true }, deadline: now + tt.accuse };
      log(room, now, 'info', `🚨 ${me.name} accuse ${target.name} d’avoir parlé anglais !`, `🚨 ${me.name} accuses ${target.name} of speaking English!`);
      if (room.players.length - 1 <= 1) resolveAccusation(room, now);
      break;
    }
    case 'accuseVote': {
      const a = room.accusation;
      if (!a) throw new GameError('Pas de vote en cours.', 'No vote is happening.');
      if (a.target === pid) throw new GameError('L’accusé(e) ne vote pas !', 'The accused player doesn’t vote!');
      a.votes[pid] = !!action.yes;
      if (Object.keys(a.votes).length >= room.players.length - 1) resolveAccusation(room, now);
      break;
    }
    case 'endNow': {
      mustHost();
      if (room.status !== 'playing') throw new GameError('La partie n’est pas en cours.', 'The game isn’t running.');
      endGame(room, now, ['L’hôte a terminé la partie.', 'The host ended the game.']);
      break;
    }
    case 'restart': {
      mustHost();
      if (room.status !== 'ended') throw new GameError('La partie n’est pas terminée.', 'The game isn’t over yet.');
      room.status = 'lobby';
      room.turn = null;
      room.lastMove = null;
      room.accusation = null;
      room.lastVerdict = null;
      room.combat = null;
      room.sprint = null;
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
      log(room, now, 'info', 'Nouvelle partie ! Tout le monde revient au départ.', 'New game! Everyone goes back to the start.');
      break;
    }
    default:
      throw new GameError('Action inconnue.', 'Unknown action.');
  }
  room.version++;
}

function clampDuration(mode: Mode, n: unknown): number {
  const v = Math.round(Number(n));
  return DURATIONS[mode].includes(v) ? v : DEFAULT_DURATION[mode];
}

// ─── Vue client ──────────────────────────────────────────────

function hide(card: DealtQuiz): DealtQuiz {
  return { ...card, answer: -1, x: '', en: { ...card.en, x: '' } };
}

/** Retire les secrets (jetons, réponses non révélées) avant d’envoyer au client. */
export function sanitize(room: ServerRoom): Room {
  const { used: _used, ...rest } = room;
  const players = room.players.map(({ token: _t, ...p }) => p);
  let turn = room.turn;
  if (turn && (turn.phase === 'quiz' || turn.phase === 'steal' || turn.phase === 'duel')) {
    turn = { ...turn, card: hide(turn.card) };
  }
  let combat = room.combat;
  if (combat && room.status === 'playing') {
    const fighters: typeof combat.fighters = {};
    for (const [id, f] of Object.entries(combat.fighters)) fighters[id] = { ...f, q: hide(f.q) };
    combat = { ...combat, fighters };
  }
  let sprint = room.sprint;
  if (sprint && !sprint.revealUntil && room.status === 'playing') sprint = { ...sprint, q: hide(sprint.q) };
  return { ...rest, players, turn, combat, sprint };
}
