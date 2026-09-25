// Simule des centaines de parties avec des actions aléatoires pour vérifier le moteur.
import { BOARD_SIZE } from '../shared/board.js';
import { EVENT_CARDS, QUIZ_DECKS, SPEAK_CARDS, TABLE_CARDS } from '../shared/cards.js';
import { addPlayer, advance, applyAction, createRoom, GameError, sanitize } from '../shared/engine.js';
import type { Action, ServerRoom } from '../shared/types.js';

function assert(cond: unknown, msg: string, room?: ServerRoom): asserts cond {
  if (!cond) {
    console.error('ÉCHEC :', msg);
    if (room) console.error(JSON.stringify(sanitize(room).turn, null, 2));
    process.exit(1);
  }
}

// 1) Contenu : pas de doublons, pas de bonne réponse parmi les mauvaises.
const ids = new Set<string>();
for (const deck of Object.values(QUIZ_DECKS)) {
  for (const c of deck) {
    assert(!ids.has(c.id), `id en double : ${c.id}`);
    ids.add(c.id);
    assert(c.w.length >= 2, `pas assez d’options : ${c.id}`);
    assert(!c.w.includes(c.a), `réponse dans les mauvaises options : ${c.id}`);
    assert(new Set(c.w).size === c.w.length, `options en double : ${c.id}`);
    assert(c.x.length > 0, `explication manquante : ${c.id}`);
  }
}
for (const c of [...SPEAK_CARDS, ...TABLE_CARDS, ...EVENT_CARDS]) {
  assert(!ids.has(c.id), `id en double : ${c.id}`);
  ids.add(c.id);
}
console.log(`✓ ${ids.size} cartes vérifiées`);

// 2) Parties aléatoires.
const ACTIONS: Action['type'][] = [
  'roll', 'answer', 'steal', 'pickOpponent', 'duelAnswer', 'doneSpeaking', 'vote',
  'tableDone', 'tableVote', 'continue', 'accuse', 'accuseVote', 'kick',
];

let totalTurns = 0;
let errors = 0;
const GAMES = 400;
for (let g = 0; g < GAMES; g++) {
  let now = 1_800_000_000_000;
  const { room, player: host } = createRoom('TEST', 'Hôte', '🐓', now);
  const n = 2 + (g % 5);
  for (let i = 1; i < n; i++) addPlayer(room, `Joueur ${i}`, '🥐', now);
  applyAction(room, host.id, { type: 'start', durationMin: 5 + (g % 3) * 5 }, now);
  assert(room.status === 'playing', 'la partie devrait commencer');

  let steps = 0;
  while (room.status === 'playing' && steps < 20_000) {
    steps++;
    now += Math.floor(Math.random() * 6_000);
    advance(room, now);
    if (room.status !== 'playing') break;
    const p = room.players[Math.floor(Math.random() * room.players.length)];
    const target = room.players[Math.floor(Math.random() * room.players.length)].id;
    let type = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    if (type === 'kick' && Math.random() > 0.01) type = 'roll';
    const action = { type, choice: Math.floor(Math.random() * 4), target, yes: Math.random() > 0.4 } as Action;
    try {
      applyAction(room, p.id, action, now);
    } catch (e) {
      if (!(e instanceof GameError)) throw e;
      errors++;
    }
    // Invariants
    assert(room.players.length >= 1, 'plus de joueurs', room);
    assert(room.turnIndex >= 0 && room.turnIndex < room.players.length, `turnIndex invalide ${room.turnIndex}`, room);
    for (const q of room.players) {
      assert(q.score >= 0, `score négatif pour ${q.name}`, room);
      assert(q.pos >= 0 && q.pos < BOARD_SIZE, `position invalide ${q.pos}`, room);
    }
    if (room.turn) {
      assert(room.players.some((q) => q.id === room.turn!.pid), 'le tour appartient à un joueur absent', room);
      assert(room.turn.pid === room.players[room.turnIndex].id, 'turn.pid ≠ joueur actif', room);
      const t = room.turn;
      if (t.phase === 'quiz' || t.phase === 'steal' || t.phase === 'duel') {
        assert(t.card.answer >= 0, 'réponse perdue', room);
        const s = sanitize(room).turn as typeof t;
        assert(s.card.answer === -1, 'la réponse fuit côté client !', room);
      }
    }
    assert(!JSON.stringify(sanitize(room)).includes('"token"'), 'un jeton fuit côté client !', room);
  }
  assert((room.status as string) === 'ended', `partie ${g} jamais terminée (${steps} étapes)`, room);
  assert(now >= room.endsAt || room.players.length < 2, 'partie terminée trop tôt', room);
  totalTurns += room.turnCount;
}
console.log(`✓ ${GAMES} parties simulées, ${totalTurns} tours, ${errors} actions refusées proprement`);

// 3) Partie scénarisée : un tour complet de quiz avec vol.
{
  let now = 1_900_000_000_000;
  const { room, player: a } = createRoom('SCEN', 'Alice', '🐓', now);
  const b = addPlayer(room, 'Bruno', '🥐', now);
  applyAction(room, a.id, { type: 'start', durationMin: 20 }, now);
  // Forcer la position juste avant une case « pp » (index 1) pour tester.
  let guard = 0;
  while (guard++ < 200) {
    const act = room.players[room.turnIndex];
    act.pos = BOARD_SIZE - 1; // prochaine case : 0 (départ) puis 1…
    applyAction(room, act.id, { type: 'roll' }, now);
    if (room.turn?.phase === 'quiz') break;
    while (room.turn?.phase !== 'roll') {
      now += 5_000;
      advance(room, now);
    }
  }
  const t = room.turn;
  assert(t?.phase === 'quiz', 'devrait être en phase quiz');
  const act = room.players[room.turnIndex];
  const other = act.id === a.id ? b : a;
  const wrong = (t.card.answer + 1) % t.card.options.length;
  const before = other.score;
  now = t.startsAt + 100;
  applyAction(room, act.id, { type: 'answer', choice: wrong }, now);
  assert(room.turn?.phase === 'steal', 'devrait passer en phase de vol');
  applyAction(room, other.id, { type: 'steal', choice: t.card.answer }, now);
  assert((room.turn?.phase as string) === 'reveal', 'devrait révéler');
  assert(other.score === before + 1, 'le voleur devrait gagner 1 🥐');
  console.log('✓ scénario quiz + vol');

  // Accusation avec 2 joueurs : vote immédiat.
  const s0 = act.score;
  applyAction(room, other.id, { type: 'accuse', target: act.id }, now);
  assert(room.accusation === null, 'accusation résolue');
  assert(act.score === Math.max(0, s0 - 1), 'pénalité anglais');
  let refused = false;
  try {
    applyAction(room, other.id, { type: 'accuse', target: act.id }, now + 1000);
  } catch {
    refused = true;
  }
  assert(refused, 'le délai entre deux accusations doit être respecté');
  console.log('✓ scénario « Anglais ! »');
}
