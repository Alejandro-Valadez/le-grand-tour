import { motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cityAt } from '../../shared/board';
import { T } from '../../shared/engine';
import type { Action, DealtQuiz, Player, Room, Turn } from '../../shared/types';
import { canSpeak, speakFrench } from '../fx';
import { serverNow } from '../hooks';
import { Av, Rich, Say, Ticket, TimeBar } from './ui';

export type Act = (a: Action) => Promise<boolean>;

interface Ctx {
  room: Room;
  me: Player | null;
  act: Act;
  busy: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

const byId = (room: Room, id?: string) => room.players.find((p) => p.id === id);
const first = (name?: string) => name ?? '…';

// ─── Petits blocs ────────────────────────────────────────────

function Status({ p, title, sub }: { p?: Player; title: ReactNode; sub?: ReactNode }) {
  return (
    <motion.div className="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {p && <Av p={p} className="big-av" />}
      <div>
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
      </div>
    </motion.div>
  );
}

function Listen({ text }: { text: string }) {
  if (!canSpeak()) return null;
  return (
    <button className="listen" onClick={() => speakFrench(text)}>
      🔊 Écouter
    </button>
  );
}

function Options({
  card,
  onPick,
  disabled,
  struck = [],
  reveal,
  tags = {},
  picked,
}: {
  card: DealtQuiz;
  onPick?: (i: number) => void;
  disabled: boolean;
  struck?: number[];
  reveal?: { answer: number; wrong: number[] };
  tags?: Record<number, string>;
  picked?: number | null;
}) {
  const short = card.options.every((o) => o.length <= 16);
  return (
    <div className={`opts${short ? ' two' : ''}`}>
      {card.options.map((o, i) => {
        const cls = ['opt'];
        if (reveal) {
          if (i === reveal.answer) cls.push('right');
          else if (reveal.wrong.includes(i)) cls.push('wrong');
          else cls.push('dim');
        } else if (struck.includes(i)) cls.push('struck');
        else if (picked === i) cls.push('right');
        return (
          <button key={i} className={cls.join(' ')} disabled={disabled || struck.includes(i)} onClick={() => onPick?.(i)}>
            <span className="letter">{LETTERS[i]}</span>
            <span>{o}</span>
            {tags[i] && <span className="tag">{tags[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function QuizFace({ card, children }: { card: DealtQuiz; children?: ReactNode }) {
  return (
    <>
      <div className="ticket-ask">{card.ask}</div>
      <h3 className="ticket-q">
        <Rich text={card.q} />
      </h3>
      {children}
    </>
  );
}

// ─── Lancer le dé ────────────────────────────────────────────

function RollPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'roll' }> }) {
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  if (mine) {
    return (
      <>
        <Status p={p} title="C’est ton tour !" sub="Lance le dé et avance sur le Grand Tour." />
        <button className="btn rouge huge block die-btn" disabled={busy} onClick={() => act({ type: 'roll' })}>
          <span className="die-mini">
            <DieMini n={5} />
          </span>
          Lance le dé !
        </button>
        <TimeBar deadline={turn.deadline} total={T.roll} label={false} />
        <Say>
          <q>C’est à moi ! Je lance le dé.</q>
        </Say>
      </>
    );
  }
  return (
    <>
      <Status p={p} title={`Au tour de ${first(p?.name)}`} sub="Tout le monde regarde le plateau…" />
      <Say>
        <q>Vas-y, {p?.name} ! Lance le dé !</q>
      </Say>
    </>
  );
}

function DieMini({ n }: { n: number }) {
  const on: Record<number, number[]> = { 5: [0, 2, 4, 6, 8] };
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ visibility: on[n].includes(i) ? 'visible' : 'hidden' }} />
      ))}
    </>
  );
}

// ─── En route (animation avant la carte) ─────────────────────

function Moving({ room }: { room: Room }) {
  const mv = room.lastMove;
  const p = byId(room, mv?.pid);
  return (
    <Status
      p={p}
      title={mv?.dice ? `${first(p?.name)} avance de ${mv.dice} case${mv.dice > 1 ? 's' : ''}…` : 'En route…'}
      sub={mv?.dice ? <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><span className="die-mini" style={{ width: 30, height: 30 }}><DieFaceMini n={mv.dice} /></span> Tchou tchou !</span> : undefined}
    />
  );
}

function DieFaceMini({ n }: { n: number }) {
  const map: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ visibility: map[n]?.includes(i) ? 'visible' : 'hidden', width: 5, height: 5 }} />
      ))}
    </>
  );
}

// ─── Quiz & vol ──────────────────────────────────────────────

function QuizPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'quiz' }> }) {
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  const [picked, setPicked] = useState<number | null>(null);
  const spoke = useRef(false);

  useEffect(() => {
    if (mine && turn.card.audio && !spoke.current) {
      spoke.current = true;
      setTimeout(() => speakFrench(turn.card.audio!), 400);
    }
  }, [mine, turn.card.audio]);

  return (
    <>
      <Ticket kind={turn.card.cat} seed={turn.card.id}>
        <QuizFace card={turn.card}>
          <TimeBar deadline={turn.deadline} total={T.quiz} />
          {turn.card.audio && <Listen text={turn.card.audio} />}
          <Options
            card={turn.card}
            disabled={!mine || busy || picked !== null}
            picked={picked}
            onPick={async (i) => {
              setPicked(i);
              const ok = await act({ type: 'answer', choice: i });
              if (!ok) setPicked(null);
            }}
          />
        </QuizFace>
      </Ticket>
      {mine ? (
        <Say label="Règle">Lis la question <b>à voix haute</b>, puis dis ta réponse avant de toucher !</Say>
      ) : (
        <Say>
          <q>Chut ! {p?.name} réfléchit…</q> Si {p?.name} se trompe, tu pourras voler la réponse !
        </Say>
      )}
    </>
  );
}

function StealPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'steal' }> }) {
  const p = byId(room, turn.pid);
  const canSteal = !!me && me.id !== turn.pid && !turn.tried.includes(me.id);
  const tried = !!me && turn.tried.includes(me.id);
  const struck = turn.firstChoice >= 0 ? [turn.firstChoice] : [];
  return (
    <>
      <Ticket kind={turn.card.cat} seed={turn.card.id}>
        <div className="banner rouge">🦊 Vol ! Le premier qui trouve gagne 1 🥐</div>
        <QuizFace card={turn.card}>
          <TimeBar deadline={turn.deadline} total={T.steal} />
          {turn.card.audio && <Listen text={turn.card.audio} />}
          <Options
            card={turn.card}
            disabled={!canSteal || busy}
            struck={struck}
            tags={turn.firstChoice >= 0 ? { [turn.firstChoice]: `choix de ${p?.name}` } : {}}
            onPick={(i) => act({ type: 'steal', choice: i })}
          />
        </QuizFace>
      </Ticket>
      <Say>
        {me?.id === turn.pid ? (
          <q>Oh non ! Qui connaît la réponse ?</q>
        ) : tried ? (
          <q>Raté ! Dommage…</q>
        ) : (
          <q>Je sais ! C’est…</q>
        )}
      </Say>
    </>
  );
}

// ─── Duel ────────────────────────────────────────────────────

function DuelPick({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'duel_pick' }> }) {
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  return (
    <Ticket kind="duel" seed={`duel-${turn.startsAt}`}>
      <div className="ticket-ask">Défi</div>
      <h3 className="ticket-q">{mine ? 'Qui veux-tu défier ?' : `${p?.name} choisit un adversaire…`}</h3>
      <p style={{ marginTop: -4 }}>Même question pour vous deux. Le plus rapide gagne <b>2 🥐</b> !</p>
      <TimeBar deadline={turn.deadline} total={T.duelPick} />
      {mine && (
        <div className="picks">
          {room.players
            .filter((q) => q.id !== me?.id)
            .map((q) => (
              <button key={q.id} className="pick" disabled={busy} onClick={() => act({ type: 'pickOpponent', target: q.id })}>
                <Av p={q} />
                {q.name}
              </button>
            ))}
        </div>
      )}
      {mine && (
        <div style={{ marginTop: 12 }}>
          <Say>
            <q>Je te défie, …&nbsp;!</q>
          </Say>
        </div>
      )}
    </Ticket>
  );
}

function DuelPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'duel' }> }) {
  const a = byId(room, turn.pid);
  const b = byId(room, turn.opp);
  const inDuel = !!me && (me.id === turn.pid || me.id === turn.opp);
  const locked = !!me && turn.locked.includes(me.id);
  const now = serverNow();
  const countdown = Math.ceil((turn.startsAt - now) / 1000);
  return (
    <Ticket kind="duel" seed={turn.card.id} title={`⚔️ ${a?.name} contre ${b?.name}`}>
      {countdown > 0 ? (
        <motion.div key={countdown} className="countdown-big" initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {countdown}
        </motion.div>
      ) : (
        <QuizFace card={turn.card}>
          <TimeBar deadline={turn.deadline} total={T.duel} />
          <Options card={turn.card} disabled={!inDuel || locked || busy} onPick={(i) => act({ type: 'duelAnswer', choice: i })} />
          {locked && <p className="muted">Raté ! Croise les doigts…</p>}
          {!inDuel && <p className="muted">Tu regardes le duel. Qui sera le plus rapide ?</p>}
        </QuizFace>
      )}
    </Ticket>
  );
}

// ─── Parler ──────────────────────────────────────────────────

function SpeakPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'speak' }> }) {
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  return (
    <>
      <Ticket kind="parle" seed={turn.card.id}>
        <div className="ticket-ask">{mine ? 'À toi de parler !' : `${p?.name} parle…`}</div>
        <h3 className="ticket-q">{turn.card.prompt}</h3>
        <span className="ticket-focus">🎯 {turn.card.focus}</span>
        <TimeBar deadline={turn.deadline} total={T.speakRead + turn.card.seconds * 1000} />
        {mine ? (
          <button className="btn vert block" disabled={busy} onClick={() => act({ type: 'doneSpeaking' })}>
            J’ai fini ! On vote ✋
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Écoute bien : tu vas voter. Est-ce que {p?.name} parle <b>100 % en français</b>, avec le bon temps ?
          </p>
        )}
      </Ticket>
      {mine ? (
        <Say label="Astuce">
          Commence par <q>Alors…</q>, <q>D’abord…</q>, <q>Ensuite…</q>, <q>Finalement…</q>
        </Say>
      ) : (
        <Say>
          <q>Et après, qu’est-ce qui s’est passé ?</q> — pose une question !
        </Say>
      )}
    </>
  );
}

function VotePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'vote' }> }) {
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  const myVote = me ? turn.votes[me.id] : undefined;
  const voters = room.players.filter((q) => q.id !== turn.pid);
  return (
    <Ticket kind="parle" seed={`${turn.card.id}-vote`} title="Le vote">
      <div className="ticket-ask">{turn.card.focus}</div>
      <h3 className="ticket-q">{mine ? 'Les autres votent…' : `Est-ce que ${p?.name} a bien parlé français ?`}</h3>
      <TimeBar deadline={turn.deadline} total={T.vote} />
      {!mine && me && (
        <div className="vote-row">
          <button className={`btn ${myVote === true ? 'vert' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'vote', yes: true })}>
            👏 Bravo !
          </button>
          <button className={`btn ${myVote === false ? 'rouge' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'vote', yes: false })}>
            🤏 Pas encore
          </button>
        </div>
      )}
      <div className="voters">
        {voters.map((q) => (
          <span key={q.id} className={`voter${q.id in turn.votes ? ' done' : ''}`}>
            {q.avatar} {q.name} {q.id in turn.votes ? '✓' : '…'}
          </span>
        ))}
      </div>
      <p className="muted" style={{ marginBottom: 0 }}>
        Chaque « Bravo » = +1 🥐 (maximum 3).
      </p>
    </Ticket>
  );
}

// ─── Tour de table ───────────────────────────────────────────

function TablePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'table_speak' }> }) {
  const idx = room.players.findIndex((q) => q.id === turn.pid);
  const order = [...room.players.slice(idx), ...room.players.slice(0, idx)];
  const canClose = me?.id === turn.pid || me?.id === room.hostId;
  return (
    <>
      <Ticket kind="table" seed={turn.card.id}>
        <div className="ticket-ask">Tout le monde répond !</div>
        <h3 className="ticket-q">{turn.card.prompt}</h3>
        <span className="ticket-focus">🎯 {turn.card.focus}</span>
        <div className="order">
          {order.map((q, i) => (
            <span key={q.id} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              {i > 0 && <span className="arrow">→</span>}
              <span>
                {q.avatar} {q.name}
              </span>
            </span>
          ))}
        </div>
        <TimeBar deadline={turn.deadline} total={T.tableSpeak} />
        {canClose ? (
          <button className="btn jaune block" disabled={busy} onClick={() => act({ type: 'tableDone' })}>
            Tout le monde a parlé → On vote !
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Quand tout le monde a répondu, {byId(room, turn.pid)?.name} lance le vote.
          </p>
        )}
      </Ticket>
      <Say>
        <q>Et toi, qu’est-ce que tu en penses ?</q>
      </Say>
    </>
  );
}

function TableVotePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'table_vote' }> }) {
  const myVote = me ? turn.votes[me.id] : undefined;
  const counts: Record<string, number> = {};
  Object.values(turn.votes).forEach((t) => (counts[t] = (counts[t] ?? 0) + 1));
  return (
    <Ticket kind="table" seed={`${turn.card.id}-vote`} title="Meilleure réponse">
      <div className="ticket-ask">Vote pour la meilleure réponse (pas la tienne !)</div>
      <h3 className="ticket-q" style={{ fontSize: '1.2rem' }}>
        {turn.card.prompt}
      </h3>
      <TimeBar deadline={turn.deadline} total={T.tableVote} />
      <div className="picks">
        {room.players.map((q) => (
          <button
            key={q.id}
            className={`pick${myVote === q.id ? ' on' : ''}`}
            disabled={!me || q.id === me.id || busy}
            onClick={() => act({ type: 'tableVote', target: q.id })}
          >
            <Av p={q} />
            {q.name}
            {q.id === me?.id && <small className="muted"> (toi)</small>}
          </button>
        ))}
      </div>
      <div className="voters">
        {room.players.map((q) => (
          <span key={q.id} className={`voter${q.id in turn.votes ? ' done' : ''}`}>
            {q.avatar} {q.id in turn.votes ? 'a voté ✓' : '…'}
          </span>
        ))}
      </div>
    </Ticket>
  );
}

// ─── Surprise & TGV ──────────────────────────────────────────

function EventPanel({ room, turn }: { room: Room; turn: Extract<Turn, { phase: 'event' }> }) {
  const p = byId(room, turn.pid);
  return (
    <Ticket kind="chance" seed={turn.card.id} title="✨ Surprise !">
      <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.5 }}>
        <div className="ticket-ask">Pour {p?.name}</div>
        <h3 className="ticket-q">{turn.card.title}</h3>
        <p style={{ fontSize: '1.08rem', marginTop: -4 }}>{turn.card.text}</p>
        <TimeBar deadline={turn.deadline} total={T.event} label={false} />
      </motion.div>
      {turn.card.effect.kind === 'birthday' && (
        <Say>
          <q>Joyeux anniversaire, {p?.name} !</q> — chantez tous ensemble !
        </Say>
      )}
    </Ticket>
  );
}

function TgvPanel({ room, turn }: { room: Room; turn: Extract<Turn, { phase: 'tgv' }> }) {
  const p = byId(room, turn.pid);
  return (
    <Ticket kind="gare" seed={`tgv-${turn.startsAt}`} title="🚄 TGV Grande Vitesse">
      <div className="ticket-ask">{p?.name} prend le train</div>
      <h3 className="ticket-q">
        {cityAt(turn.from)} <span style={{ color: 'var(--rouge)' }}>→</span> {cityAt(turn.to)}
      </h3>
      <p style={{ marginTop: -4 }}>Six cases d’un coup ! {turn.to === 0 && 'Et un tour de France complet : +3 🥐 !'}</p>
      <Say>
        <q>Mesdames et messieurs, bienvenue à bord du TGV à destination de {cityAt(turn.to)}.</q>
      </Say>
    </Ticket>
  );
}

// ─── Résultat ────────────────────────────────────────────────

function RevealPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'reveal' }> }) {
  const o = turn.outcome;
  const p = byId(room, turn.pid);
  const canGo = me?.id === turn.pid || me?.id === room.hostId;
  const left = Math.max(0, Math.ceil((turn.deadline - serverNow()) / 1000));
  const next = (
    <div style={{ display: 'grid', gap: 8 }}>
      {canGo && (
        <button className="btn block" disabled={busy} onClick={() => act({ type: 'continue' })}>
          Au suivant ➜
        </button>
      )}
      <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
        Tour suivant dans {left} s
      </p>
    </div>
  );

  if (o.kind === 'quiz') {
    const stealer = byId(room, o.stealer);
    const tags: Record<number, string> = {};
    if (o.choice >= 0) tags[o.choice] = `${p?.name}`;
    if (stealer && o.stealChoice !== undefined) tags[o.stealChoice] = `volé par ${stealer.name}`;
    const stamp = o.correct ? { ok: true, text: 'Composté ✓' } : stealer ? { ok: true, text: 'Volé !' } : { ok: false, text: 'Refusé' };
    return (
      <>
        <Ticket kind={o.card.cat} seed={o.card.id} stamp={stamp}>
          <QuizFace card={o.card}>
            <Options card={o.card} disabled reveal={{ answer: o.card.answer, wrong: o.correct ? [] : [o.choice] }} tags={tags} />
            {o.card.audio && (
              <div style={{ marginTop: 10 }}>
                <Listen text={o.card.audio} />
              </div>
            )}
            <div className="explain">
              <span>💡</span>
              <span>{o.card.x}</span>
            </div>
          </QuizFace>
        </Ticket>
        <Say>
          {o.correct ? <q>Bien joué, {p?.name} !</q> : stealer ? <q>Bravo {stealer.name}, bien volé !</q> : <q>Dommage ! La bonne réponse, c’est « {o.card.options[o.card.answer]} ».</q>}
        </Say>
        {next}
      </>
    );
  }

  if (o.kind === 'duel') {
    const w = byId(room, o.winner);
    return (
      <>
        <Ticket kind="duel" seed={o.card.id} stamp={w ? { ok: true, text: `${w.name} gagne` } : { ok: false, text: 'Égalité' }}>
          <QuizFace card={o.card}>
            <Options card={o.card} disabled reveal={{ answer: o.card.answer, wrong: [] }} />
            <div className="explain">
              <span>💡</span>
              <span>{o.card.x}</span>
            </div>
          </QuizFace>
        </Ticket>
        {next}
      </>
    );
  }

  if (o.kind === 'speak') {
    return (
      <>
        <Ticket kind="parle" seed={`${o.card.id}-r`} stamp={o.gained > 0 ? { ok: true, text: `+${o.gained} 🥐` } : { ok: false, text: '0 🥐' }}>
          <div className="ticket-ask">{p?.name} a parlé</div>
          <h3 className="ticket-q" style={{ fontSize: '1.2rem' }}>
            {o.card.prompt}
          </h3>
          <div className="big-result">
            <div className="n">
              {o.yes} 👏 · {o.no} 🤏
            </div>
            <p>{o.gained > 0 ? `${p?.name} gagne ${o.gained} croissant${o.gained > 1 ? 's' : ''} !` : 'Pas de croissant cette fois… Courage !'}</p>
          </div>
        </Ticket>
        <Say>
          <q>{o.gained > 0 ? 'Chapeau ! Tu parles super bien.' : 'Ce n’est pas grave, on progresse !'}</q>
        </Say>
        {next}
      </>
    );
  }

  const winners = o.winners.map((id) => byId(room, id)).filter(Boolean) as Player[];
  return (
    <>
      <Ticket kind="table" seed={`${o.card.id}-r`} stamp={winners.length ? { ok: true, text: '+2 🥐' } : { ok: false, text: 'Aucun vote' }}>
        <div className="ticket-ask">Meilleure réponse</div>
        <h3 className="ticket-q">{winners.length ? winners.map((w) => w.name).join(' et ') : 'Personne…'}</h3>
        <div className="voters">
          {room.players.map((q) => (
            <span key={q.id} className={`voter${o.winners.includes(q.id) ? ' done' : ''}`}>
              {q.avatar} {q.name} : {o.tally[q.id] ?? 0}
            </span>
          ))}
        </div>
      </Ticket>
      {next}
    </>
  );
}

// ─── Aiguillage ──────────────────────────────────────────────

export function Dock(ctx: Ctx) {
  const t = ctx.room.turn;
  const now = serverNow();
  if (!t) return null;
  if ('startsAt' in t && now < t.startsAt && t.phase !== 'duel') return <Moving room={ctx.room} />;
  switch (t.phase) {
    case 'roll':
      return <RollPanel {...ctx} turn={t} />;
    case 'quiz':
      return <QuizPanel key={t.card.id + t.startsAt} {...ctx} turn={t} />;
    case 'steal':
      return <StealPanel {...ctx} turn={t} />;
    case 'duel_pick':
      return <DuelPick {...ctx} turn={t} />;
    case 'duel':
      return <DuelPanel {...ctx} turn={t} />;
    case 'speak':
      return <SpeakPanel {...ctx} turn={t} />;
    case 'vote':
      return <VotePanel {...ctx} turn={t} />;
    case 'table_speak':
      return <TablePanel {...ctx} turn={t} />;
    case 'table_vote':
      return <TableVotePanel {...ctx} turn={t} />;
    case 'event':
      return <EventPanel room={ctx.room} turn={t} />;
    case 'tgv':
      return <TgvPanel room={ctx.room} turn={t} />;
    case 'reveal':
      return <RevealPanel {...ctx} turn={t} />;
  }
}

/** Le plateau se fait plus petit quand une carte est ouverte. */
export function cardOpen(room: Room): boolean {
  const t = room.turn;
  if (!t || t.phase === 'roll') return false;
  if ('startsAt' in t && serverNow() < t.startsAt && t.phase !== 'duel') return false;
  return true;
}

