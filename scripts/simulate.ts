// Simule des centaines de parties avec des actions aléatoires pour vérifier le moteur.
import { BOARD_SIZE, KINDS } from '../shared/board.js';
import { EVENT_CARDS, QUIZ_DECKS, SPEAK_CARDS, TABLE_CARDS } from '../shared/cards.js';
import { addPlayer, advance, applyAction, COMBAT, createRoom, DURATIONS, GameError, MODES, sanitize } from '../shared/engine.js';
import type { Action, Mode, ServerRoom } from '../shared/types.js';

function assert(cond: unknown, msg: string, room?: ServerRoom): asserts cond {
  if (!cond) {
    console.error('ÉCHEC :', msg);
    if (room) console.error(JSON.stringify({ mode: room.mode, turn: sanitize(room).turn }, null, 2).slice(0, 1500));
    process.exit(1);
  }
}

// 1) Contenu : pas de doublons, pas de bonne réponse parmi les mauvaises, traductions présentes.
const ids = new Set<string>();
for (const deck of Object.values(QUIZ_DECKS)) {
  for (const c of deck) {
    assert(!ids.has(c.id), `id en double : ${c.id}`);
    ids.add(c.id);
    assert(c.w.length >= 2, `pas assez d’options : ${c.id}`);
    assert(!c.w.includes(c.a), `réponse dans les mauvaises options : ${c.id}`);
    assert(new Set(c.w).size === c.w.length, `options en double : ${c.id}`);
    assert(c.x.length > 0, `explication manquante : ${c.id}`);
    assert(c.en.ask && c.en.q && c.en.x, `traduction manquante : ${c.id}`);
    assert(c.q.includes('___') === c.en.q.includes('___'), `blanc absent de la traduction : ${c.id}`);
  }
}
for (const c of [...SPEAK_CARDS, ...TABLE_CARDS]) {
  assert(!ids.has(c.id), `id en double : ${c.id}`);
  ids.add(c.id);
  assert(c.en.prompt && c.en.focus, `traduction manquante : ${c.id}`);
}
for (const c of EVENT_CARDS) {
  assert(!ids.has(c.id), `id en double : ${c.id}`);
  ids.add(c.id);
  assert(c.en.title && c.en.text, `traduction manquante : ${c.id}`);
}
for (const [k, info] of Object.entries(KINDS)) assert(info.en.label && info.en.blurb, `traduction manquante : case ${k}`);
console.log(`✓ ${ids.size} cartes vérifiées (avec traductions)`);

// 2) Parties aléatoires, dans les trois modes.
const ACTIONS: Action['type'][] = [
  'roll', 'answer', 'steal', 'pickOpponent', 'duelAnswer', 'doneSpeaking', 'vote',
  'tableDone', 'tableVote', 'continue', 'accuse', 'accuseVote', 'kick', 'fight', 'fight', 'fight', 'target', 'sprintAnswer', 'sprintAnswer',
];

function play(mode: Mode, g: number) {
  let now = 1_800_000_000_000 + g * 1e7;
  const { room, player: host } = createRoom('TEST', 'Hôte', '🐓', now);
  const n = 2 + (g % 5);
  for (let i = 1; i < n; i++) addPlayer(room, `Joueur ${i}`, '🥐', now);
  applyAction(room, host.id, { type: 'setMode', mode }, now);
  const durs = DURATIONS[mode];
  const dur = durs[g % durs.length];
  applyAction(room, host.id, { type: 'setDuration', durationMin: dur }, now);
  assert(room.durationMin === dur, `durée non appliquée (${mode})`);
  applyAction(room, host.id, { type: 'start', durationMin: dur }, now);
  assert(room.status === 'playing', 'la partie devrait commencer');

  let steps = 0;
  let errors = 0;
  const step = mode === 'plateau' ? 6_000 : 1_500;
  while (room.status === 'playing' && steps < 50_000) {
    steps++;
    now += Math.floor(Math.random() * step);
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
      assert(e.en.length > 0, `erreur sans traduction : ${e.message}`);
      errors++;
    }
    // Invariants
    assert(room.players.length >= 1, 'plus de joueurs', room);
    assert(room.turnIndex >= 0 && room.turnIndex < room.players.length, `turnIndex invalide ${room.turnIndex}`, room);
    for (const q of room.players) {
      assert(q.score >= 0, `score négatif pour ${q.name}`, room);
      assert(q.pos >= 0 && q.pos < BOARD_SIZE, `position invalide ${q.pos}`, room);
    }
    for (const l of room.log) assert(l.en, `journal sans traduction : ${l.text}`, room);
    const view = sanitize(room);
    if (mode === 'plateau' && room.turn && room.status === 'playing') {
      assert(room.players.some((q) => q.id === room.turn!.pid), 'le tour appartient à un joueur absent', room);
      assert(room.turn.pid === room.players[room.turnIndex].id, 'turn.pid ≠ joueur actif', room);
      const t = room.turn;
      if (t.phase === 'quiz' || t.phase === 'steal' || t.phase === 'duel') {
        assert(t.card.answer >= 0, 'réponse perdue', room);
        assert((view.turn as typeof t).card.answer === -1, 'la réponse fuit côté client !', room);
        assert((view.turn as typeof t).card.en.x === '', 'l’explication anglaise fuit !', room);
      }
    }
    if (mode === 'combat' && room.status === 'playing') {
      for (const [id, f] of Object.entries(room.combat!.fighters)) {
        assert(room.players.some((q) => q.id === id), 'combattant fantôme', room);
        assert(f.hp >= 0 && f.hp <= COMBAT.hp, `PV invalides ${f.hp}`, room);
        assert(view.combat!.fighters[id].q.answer === -1, 'réponse de combat visible !', room);
      }
    }
    if (mode === 'sprint' && room.status === 'playing' && !room.sprint!.revealUntil) {
      assert(view.sprint!.q.answer === -1, 'réponse du sprint visible !', room);
    }
    assert(!JSON.stringify(view).includes('"token"'), 'un jeton fuit côté client !', room);
  }
  assert((room.status as string) === 'ended', `partie ${mode} ${g} jamais terminée (${steps} étapes)`, room);
  const cap = mode === 'plateau' && dur > 2 ? 30_000 : mode === 'plateau' ? 0 : 20_000;
  assert(room.players.length < 2 || now <= room.endsAt + cap + step + 60_000, `partie ${mode} trop longue`, room);
  if (mode === 'combat') assert(room.combat!.winners.length >= 1, 'combat sans vainqueur', room);
  return { turns: room.turnCount, errors };
}

for (const mode of MODES) {
  let errs = 0;
  let turns = 0;
  const GAMES = 250;
  for (let g = 0; g < GAMES; g++) {
    const r = play(mode, g);
    errs += r.errors;
    turns += r.turns;
  }
  console.log(`✓ ${mode} : ${GAMES} parties simulées${mode === 'plateau' ? `, ${turns} tours` : ''}, ${errs} actions refusées proprement`);
}

// 3) Scénarios.
{
  let now = 1_900_000_000_000;
  const { room, player: a } = createRoom('SCEN', 'Alice', '🐓', now);
  const b = addPlayer(room, 'Bruno', '🥐', now);
  applyAction(room, a.id, { type: 'start', durationMin: 5 }, now);
  let guard = 0;
  while (guard++ < 200) {
    const act = room.players[room.turnIndex];
    act.pos = BOARD_SIZE - 1;
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
}

{
  // Combat 1 contre 1 : Alice répond juste jusqu'au K.O.
  let now = 2_000_000_000_000;
  const { room, player: a } = createRoom('FITE', 'Alice', '🐓', now);
  const b = addPlayer(room, 'Bruno', '🥐', now);
  applyAction(room, a.id, { type: 'setMode', mode: 'combat' }, now);
  applyAction(room, a.id, { type: 'start', durationMin: 2 }, now);
  let refused = false;
  try {
    applyAction(room, a.id, { type: 'fight', choice: 0 }, now);
  } catch {
    refused = true;
  }
  assert(refused, 'pas de coups pendant le compte à rebours');
  now = room.combat!.startsAt + 10;
  let hits = 0;
  while (room.status === 'playing' && hits < 50) {
    now += 1_000;
    const f = room.combat!.fighters[a.id];
    applyAction(room, a.id, { type: 'fight', choice: f.q.answer }, now);
    hits++;
  }
  const fb = room.combat!.fighters[b.id];
  assert(room.status === 'ended' && fb.hp === 0 && fb.koAt > 0, 'Bruno devrait être K.O.');
  assert(room.combat!.winners[0] === a.id, 'Alice devrait gagner');
  assert(hits <= 8, `trop de coups pour un K.O. (${hits}) — les combos devraient accélérer`);
  console.log(`✓ scénario combat : K.O. en ${hits} coups (combos + vitesse)`);
}

{
  // Sprint : le premier juste gagne 3 pts, le second 1 pt.
  let now = 2_100_000_000_000;
  const { room, player: a } = createRoom('RACE', 'Alice', '🐓', now);
  const b = addPlayer(room, 'Bruno', '🥐', now);
  applyAction(room, a.id, { type: 'setMode', mode: 'sprint' }, now);
  applyAction(room, a.id, { type: 'start', durationMin: 1 }, now);
  now = room.sprint!.qAt + 500;
  const ans = room.sprint!.q.answer;
  applyAction(room, b.id, { type: 'sprintAnswer', choice: ans }, now);
  applyAction(room, a.id, { type: 'sprintAnswer', choice: ans }, now + 100);
  assert(b.score === 3 && a.score === 1, `points du sprint incorrects (${b.score}, ${a.score})`);
  assert(room.sprint!.revealUntil > 0, 'la question devrait se fermer quand tout le monde a répondu');
  console.log('✓ scénario sprint');
}

{
  // « Anglais ! » avec 2 joueurs : vote immédiat, puis délai.
  const now = 2_200_000_000_000;
  const { room, player: a } = createRoom('ENGL', 'Alice', '🐓', now);
  const b = addPlayer(room, 'Bruno', '🥐', now);
  applyAction(room, a.id, { type: 'start', durationMin: 5 }, now);
  b.score = 3;
  applyAction(room, a.id, { type: 'accuse', target: b.id }, now);
  assert(room.accusation === null && b.score === 2, 'pénalité anglais');
  let refused = false;
  try {
    applyAction(room, a.id, { type: 'accuse', target: b.id }, now + 1000);
  } catch (e) {
    refused = e instanceof GameError && e.en.includes('Wait');
  }
  assert(refused, 'le délai entre deux accusations doit être respecté');
  console.log('✓ scénario « Anglais ! »');
}
