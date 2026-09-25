import { motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cityAt } from '../../shared/board';
import { timersFor } from '../../shared/engine';
import type { Action, DealtQuiz, Player, Room, Turn } from '../../shared/types';
import { canSpeak, speakFrench } from '../fx';
import { serverNow } from '../hooks';
import { useT } from '../peek';
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

export function Listen({ text }: { text: string }) {
  const t = useT();
  if (!canSpeak()) return null;
  return (
    <button className="listen" onClick={() => speakFrench(text)}>
      🔊 {t('Écouter', 'Listen')}
    </button>
  );
}

export function Options({
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
        else if (picked === i) cls.push('picked');
        return (
          <button key={i} className={cls.join(' ')} disabled={disabled || struck.includes(i)} onClick={() => onPick?.(i)} lang="fr">
            <span className="letter">{LETTERS[i]}</span>
            <span>{o}</span>
            {tags[i] && <span className="tag">{tags[i]}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Question + consigne ; en anglais pendant le « peek » (les options restent en français). */
export function QuizFace({ card, children }: { card: DealtQuiz; children?: ReactNode }) {
  const t = useT();
  return (
    <>
      <div className="ticket-ask">{t(card.ask, card.en.ask)}</div>
      <h3 className="ticket-q">
        <Rich text={t(card.q, card.en.q)} />
      </h3>
      {children}
    </>
  );
}

export function Explain({ card }: { card: DealtQuiz }) {
  const t = useT();
  const x = t(card.x, card.en.x);
  if (!x) return null;
  return (
    <div className="explain">
      <span>💡</span>
      <span>{x}</span>
    </div>
  );
}

function DieMini({ n }: { n: number }) {
  const map: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ visibility: map[n]?.includes(i) ? 'visible' : 'hidden' }} />
      ))}
    </>
  );
}

// ─── Lancer le dé ────────────────────────────────────────────

function RollPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'roll' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  if (mine) {
    return (
      <>
        <Status p={p} title={t('C’est ton tour !', 'It’s your turn!')} sub={t('Lance le dé et avance sur le Grand Tour.', 'Roll the die and move along the Grand Tour.')} />
        <button className="btn rouge huge block die-btn" disabled={busy} onClick={() => act({ type: 'roll' })}>
          <span className="die-mini">
            <DieMini n={5} />
          </span>
          {t('Lance le dé !', 'Roll the die!')}
        </button>
        <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).roll} label={false} />
        <Say>
          <q lang="fr">C’est à moi ! Je lance le dé.</q>
          {t(null, <span className="gloss"> — It’s my turn! I’m rolling the die.</span>)}
        </Say>
      </>
    );
  }
  return (
    <>
      <Status p={p} title={t(`Au tour de ${first(p?.name)}`, `${first(p?.name)}’s turn`)} sub={t('Tout le monde regarde le plateau…', 'Everyone watch the board…')} />
      <Say>
        <q lang="fr">Vas-y, {p?.name} ! Lance le dé !</q>
        {t(null, <span className="gloss"> — Go on, {p?.name}! Roll the die!</span>)}
      </Say>
    </>
  );
}

// ─── En route (animation avant la carte) ─────────────────────

function Moving({ room }: { room: Room }) {
  const t = useT();
  const mv = room.lastMove;
  const p = byId(room, mv?.pid);
  const n = mv?.dice ?? 0;
  return (
    <Status
      p={p}
      title={n ? t(`${first(p?.name)} avance de ${n} case${n > 1 ? 's' : ''}…`, `${first(p?.name)} moves ${n} space${n > 1 ? 's' : ''}…`) : t('En route…', 'On the way…')}
      sub={
        n ? (
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <span className="die-mini" style={{ width: 30, height: 30 }}>
              <DieMini n={n} />
            </span>
            {t('Tchou tchou !', 'Choo choo!')}
          </span>
        ) : undefined
      }
    />
  );
}

// ─── Quiz & vol ──────────────────────────────────────────────

function QuizPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'quiz' }> }) {
  const t = useT();
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
          <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).quiz} />
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
        <Say label={t('Règle', 'Rule')}>
          {t(
            <>
              Lis la question <b>à voix haute</b>, puis dis ta réponse avant de toucher !
            </>,
            <>
              Read the question <b>out loud</b>, then say your answer before you tap!
            </>,
          )}
        </Say>
      ) : (
        <Say>
          <q lang="fr">Chut ! {p?.name} réfléchit…</q>{' '}
          {t(`Si ${p?.name} se trompe, tu pourras voler la réponse !`, `(Shh! ${p?.name} is thinking…) If ${p?.name} gets it wrong, you can steal the answer!`)}
        </Say>
      )}
    </>
  );
}

function StealPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'steal' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  const canSteal = !!me && me.id !== turn.pid && !turn.tried.includes(me.id);
  const tried = !!me && turn.tried.includes(me.id);
  const struck = turn.firstChoice >= 0 ? [turn.firstChoice] : [];
  return (
    <>
      <Ticket kind={turn.card.cat} seed={turn.card.id}>
        <div className="banner rouge">{t('🦊 Vol ! Le premier qui trouve gagne 1 🥐', '🦊 Steal! The first to get it wins 1 🥐')}</div>
        <QuizFace card={turn.card}>
          <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).steal} />
          {turn.card.audio && <Listen text={turn.card.audio} />}
          <Options
            card={turn.card}
            disabled={!canSteal || busy}
            struck={struck}
            tags={turn.firstChoice >= 0 ? { [turn.firstChoice]: t(`choix de ${p?.name}`, `${p?.name}’s pick`) } : {}}
            onPick={(i) => act({ type: 'steal', choice: i })}
          />
        </QuizFace>
      </Ticket>
      <Say>
        {me?.id === turn.pid ? (
          <q lang="fr">Oh non ! Qui connaît la réponse ?</q>
        ) : tried ? (
          <q lang="fr">Raté ! Dommage…</q>
        ) : (
          <q lang="fr">Je sais ! C’est…</q>
        )}
        {t(null, <span className="gloss"> — {me?.id === turn.pid ? 'Oh no! Who knows the answer?' : tried ? 'Missed! Too bad…' : 'I know! It’s…'}</span>)}
      </Say>
    </>
  );
}

// ─── Duel ────────────────────────────────────────────────────

function DuelPick({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'duel_pick' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  return (
    <Ticket kind="duel" seed={`duel-${turn.startsAt}`}>
      <div className="ticket-ask">{t('Défi', 'Challenge')}</div>
      <h3 className="ticket-q">{mine ? t('Qui veux-tu défier ?', 'Who do you want to challenge?') : t(`${p?.name} choisit un adversaire…`, `${p?.name} is picking an opponent…`)}</h3>
      <p style={{ marginTop: -4 }}>
        {t(
          <>
            Même question pour vous deux. Le plus rapide gagne <b>2 🥐</b> !
          </>,
          <>
            Same question for both of you. The fastest wins <b>2 🥐</b>!
          </>,
        )}
      </p>
      <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).duelPick} />
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
            <q lang="fr">Je te défie, …&nbsp;!</q>
            {t(null, <span className="gloss"> — I challenge you, …!</span>)}
          </Say>
        </div>
      )}
    </Ticket>
  );
}

function DuelPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'duel' }> }) {
  const t = useT();
  const a = byId(room, turn.pid);
  const b = byId(room, turn.opp);
  const inDuel = !!me && (me.id === turn.pid || me.id === turn.opp);
  const locked = !!me && turn.locked.includes(me.id);
  const countdown = Math.ceil((turn.startsAt - serverNow()) / 1000);
  return (
    <Ticket kind="duel" seed={turn.card.id} title={t(`⚔️ ${a?.name} contre ${b?.name}`, `⚔️ ${a?.name} vs. ${b?.name}`)}>
      {countdown > 0 ? (
        <motion.div key={countdown} className="countdown-big" initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {countdown}
        </motion.div>
      ) : (
        <QuizFace card={turn.card}>
          <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).duel} />
          <Options card={turn.card} disabled={!inDuel || locked || busy} onPick={(i) => act({ type: 'duelAnswer', choice: i })} />
          {locked && <p className="muted">{t('Raté ! Croise les doigts…', 'Missed! Cross your fingers…')}</p>}
          {!inDuel && <p className="muted">{t('Tu regardes le duel. Qui sera le plus rapide ?', 'You’re watching the duel. Who will be faster?')}</p>}
        </QuizFace>
      )}
    </Ticket>
  );
}

// ─── Parler ──────────────────────────────────────────────────

function SpeakPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'speak' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  const tt = timersFor(room.durationMin);
  return (
    <>
      <Ticket kind="parle" seed={turn.card.id}>
        <div className="ticket-ask">{mine ? t('À toi de parler !', 'Your turn to talk!') : t(`${p?.name} parle…`, `${p?.name} is talking…`)}</div>
        <h3 className="ticket-q">{t(turn.card.prompt, turn.card.en.prompt)}</h3>
        <span className="ticket-focus">🎯 {t(turn.card.focus, turn.card.en.focus)}</span>
        <TimeBar deadline={turn.deadline} total={tt.speakRead + turn.card.seconds * 1000} />
        {mine ? (
          <button className="btn vert block" disabled={busy} onClick={() => act({ type: 'doneSpeaking' })}>
            {t('J’ai fini ! On vote ✋', 'I’m done! Let’s vote ✋')}
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {t(
              <>
                Écoute bien : tu vas voter. Est-ce que {p?.name} parle <b>100 % en français</b>, avec le bon temps ?
              </>,
              <>
                Listen carefully: you’re going to vote. Is {p?.name} speaking <b>100% in French</b>, with the right tense?
              </>,
            )}
          </p>
        )}
      </Ticket>
      {mine ? (
        <Say label={t('Astuce', 'Tip')}>
          {t('Commence par', 'Start with')} <q lang="fr">Alors…</q>, <q lang="fr">D’abord…</q>, <q lang="fr">Ensuite…</q>, <q lang="fr">Finalement…</q>
          {t(null, <span className="gloss"> (So… First… Next… Finally…)</span>)}
        </Say>
      ) : (
        <Say>
          <q lang="fr">Et après, qu’est-ce qui s’est passé ?</q> {t('— pose une question !', '(And then what happened?) — ask a question!')}
        </Say>
      )}
    </>
  );
}

function VotePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'vote' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  const mine = me?.id === turn.pid;
  const myVote = me ? turn.votes[me.id] : undefined;
  const voters = room.players.filter((q) => q.id !== turn.pid);
  return (
    <Ticket kind="parle" seed={`${turn.card.id}-vote`} title={t('Le vote', 'The vote')}>
      <div className="ticket-ask">{t(turn.card.focus, turn.card.en.focus)}</div>
      <h3 className="ticket-q">{mine ? t('Les autres votent…', 'The others are voting…') : t(`Est-ce que ${p?.name} a bien parlé français ?`, `Did ${p?.name} speak good French?`)}</h3>
      <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).vote} />
      {!mine && me && (
        <div className="vote-row">
          <button className={`btn ${myVote === true ? 'vert' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'vote', yes: true })}>
            👏 {t('Bravo !', 'Great!')}
          </button>
          <button className={`btn ${myVote === false ? 'rouge' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'vote', yes: false })}>
            🤏 {t('Pas encore', 'Not yet')}
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
        {t('Chaque « Bravo » = +1 🥐 (maximum 3).', 'Each “Bravo” = +1 🥐 (3 max).')}
      </p>
    </Ticket>
  );
}

// ─── Tour de table ───────────────────────────────────────────

function TablePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'table_speak' }> }) {
  const t = useT();
  const idx = room.players.findIndex((q) => q.id === turn.pid);
  const order = [...room.players.slice(idx), ...room.players.slice(0, idx)];
  const canClose = me?.id === turn.pid || me?.id === room.hostId;
  const host = byId(room, turn.pid)?.name;
  return (
    <>
      <Ticket kind="table" seed={turn.card.id}>
        <div className="ticket-ask">{t('Tout le monde répond !', 'Everyone answers!')}</div>
        <h3 className="ticket-q">{t(turn.card.prompt, turn.card.en.prompt)}</h3>
        <span className="ticket-focus">🎯 {t(turn.card.focus, turn.card.en.focus)}</span>
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
        <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).tableSpeak} />
        {canClose ? (
          <button className="btn jaune block" disabled={busy} onClick={() => act({ type: 'tableDone' })}>
            {t('Tout le monde a parlé → On vote !', 'Everyone’s spoken → Let’s vote!')}
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {t(`Quand tout le monde a répondu, ${host} lance le vote.`, `When everyone has answered, ${host} starts the vote.`)}
          </p>
        )}
      </Ticket>
      <Say>
        <q lang="fr">Et toi, qu’est-ce que tu en penses ?</q>
        {t(null, <span className="gloss"> — And you, what do you think?</span>)}
      </Say>
    </>
  );
}

function TableVotePanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'table_vote' }> }) {
  const t = useT();
  const myVote = me ? turn.votes[me.id] : undefined;
  return (
    <Ticket kind="table" seed={`${turn.card.id}-vote`} title={t('Meilleure réponse', 'Best answer')}>
      <div className="ticket-ask">{t('Vote pour la meilleure réponse (pas la tienne !)', 'Vote for the best answer (not your own!)')}</div>
      <h3 className="ticket-q" style={{ fontSize: '1.2rem' }}>
        {t(turn.card.prompt, turn.card.en.prompt)}
      </h3>
      <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).tableVote} />
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
            {q.id === me?.id && <small className="muted"> {t('(toi)', '(you)')}</small>}
          </button>
        ))}
      </div>
      <div className="voters">
        {room.players.map((q) => (
          <span key={q.id} className={`voter${q.id in turn.votes ? ' done' : ''}`}>
            {q.avatar} {q.id in turn.votes ? t('a voté ✓', 'voted ✓') : '…'}
          </span>
        ))}
      </div>
    </Ticket>
  );
}

// ─── Surprise & TGV ──────────────────────────────────────────

function EventPanel({ room, turn }: { room: Room; turn: Extract<Turn, { phase: 'event' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  return (
    <Ticket kind="chance" seed={turn.card.id} title={t('✨ Surprise !', '✨ Surprise!')}>
      <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.5 }}>
        <div className="ticket-ask">{t(`Pour ${p?.name}`, `For ${p?.name}`)}</div>
        <h3 className="ticket-q">{t(turn.card.title, turn.card.en.title)}</h3>
        <p style={{ fontSize: '1.08rem', marginTop: -4 }}>{t(turn.card.text, turn.card.en.text)}</p>
        <TimeBar deadline={turn.deadline} total={timersFor(room.durationMin).event} label={false} />
      </motion.div>
      {turn.card.effect.kind === 'birthday' && (
        <Say>
          <q lang="fr">Joyeux anniversaire, {p?.name} !</q> {t('— chantez tous ensemble !', '— everybody sing together!')}
        </Say>
      )}
    </Ticket>
  );
}

function TgvPanel({ room, turn }: { room: Room; turn: Extract<Turn, { phase: 'tgv' }> }) {
  const t = useT();
  const p = byId(room, turn.pid);
  return (
    <Ticket kind="gare" seed={`tgv-${turn.startsAt}`} title={t('🚄 TGV Grande Vitesse', '🚄 TGV high-speed train')}>
      <div className="ticket-ask">{t(`${p?.name} prend le train`, `${p?.name} takes the train`)}</div>
      <h3 className="ticket-q">
        {cityAt(turn.from)} <span style={{ color: 'var(--rouge)' }}>→</span> {cityAt(turn.to)}
      </h3>
      <p style={{ marginTop: -4 }}>
        {t('Six cases d’un coup !', 'Six spaces in one go!')} {turn.to === 0 && t('Et un tour de France complet : +3 🥐 !', 'And a full lap of France: +3 🥐!')}
      </p>
      <Say>
        <q lang="fr">Mesdames et messieurs, bienvenue à bord du TGV à destination de {cityAt(turn.to)}.</q>
        {t(null, <span className="gloss"> — Ladies and gentlemen, welcome aboard the TGV to {cityAt(turn.to)}.</span>)}
      </Say>
    </Ticket>
  );
}

// ─── Résultat ────────────────────────────────────────────────

function RevealPanel({ room, me, act, busy, turn }: Ctx & { turn: Extract<Turn, { phase: 'reveal' }> }) {
  const t = useT();
  const o = turn.outcome;
  const p = byId(room, turn.pid);
  const canGo = me?.id === turn.pid || me?.id === room.hostId;
  const left = Math.max(0, Math.ceil((turn.deadline - serverNow()) / 1000));
  const next = (
    <div style={{ display: 'grid', gap: 8 }}>
      {canGo && (
        <button className="btn block" disabled={busy} onClick={() => act({ type: 'continue' })}>
          {t('Au suivant ➜', 'Next ➜')}
        </button>
      )}
      <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
        {t(`Tour suivant dans ${left} s`, `Next turn in ${left} s`)}
      </p>
    </div>
  );

  if (o.kind === 'quiz') {
    const stealer = byId(room, o.stealer);
    const tags: Record<number, string> = {};
    if (o.choice >= 0) tags[o.choice] = `${p?.name}`;
    if (stealer && o.stealChoice !== undefined) tags[o.stealChoice] = t(`volé par ${stealer.name}`, `stolen by ${stealer.name}`);
    const stamp = o.correct
      ? { ok: true, text: t('Composté ✓', 'Stamped ✓') }
      : stealer
        ? { ok: true, text: t('Volé !', 'Stolen!') }
        : { ok: false, text: t('Refusé', 'Rejected') };
    const answer = o.card.options[o.card.answer];
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
            <Explain card={o.card} />
          </QuizFace>
        </Ticket>
        <Say>
          {o.correct ? (
            <q lang="fr">Bien joué, {p?.name} !</q>
          ) : stealer ? (
            <q lang="fr">Bravo {stealer.name}, bien volé !</q>
          ) : (
            <q lang="fr">Dommage ! La bonne réponse, c’est « {answer} ».</q>
          )}
          {t(
            null,
            <span className="gloss"> — {o.correct ? `Nice job, ${p?.name}!` : stealer ? `Well stolen, ${stealer.name}!` : `Too bad! The right answer is “${answer}”.`}</span>,
          )}
        </Say>
        {next}
      </>
    );
  }

  if (o.kind === 'duel') {
    const w = byId(room, o.winner);
    return (
      <>
        <Ticket kind="duel" seed={o.card.id} stamp={w ? { ok: true, text: t(`${w.name} gagne`, `${w.name} wins`) } : { ok: false, text: t('Égalité', 'Tie') }}>
          <QuizFace card={o.card}>
            <Options card={o.card} disabled reveal={{ answer: o.card.answer, wrong: [] }} />
            <Explain card={o.card} />
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
          <div className="ticket-ask">{t(`${p?.name} a parlé`, `${p?.name} spoke`)}</div>
          <h3 className="ticket-q" style={{ fontSize: '1.2rem' }}>
            {t(o.card.prompt, o.card.en.prompt)}
          </h3>
          <div className="big-result">
            <div className="n">
              {o.yes} 👏 · {o.no} 🤏
            </div>
            <p>
              {o.gained > 0
                ? t(`${p?.name} gagne ${o.gained} croissant${o.gained > 1 ? 's' : ''} !`, `${p?.name} wins ${o.gained} croissant${o.gained > 1 ? 's' : ''}!`)
                : t('Pas de croissant cette fois… Courage !', 'No croissant this time… Keep going!')}
            </p>
          </div>
        </Ticket>
        <Say>
          <q lang="fr">{o.gained > 0 ? 'Chapeau ! Tu parles super bien.' : 'Ce n’est pas grave, on progresse !'}</q>
          {t(null, <span className="gloss"> — {o.gained > 0 ? 'Hats off! You speak really well.' : 'No big deal, we’re getting better!'}</span>)}
        </Say>
        {next}
      </>
    );
  }

  const winners = o.winners.map((id) => byId(room, id)).filter(Boolean) as Player[];
  return (
    <>
      <Ticket kind="table" seed={`${o.card.id}-r`} stamp={winners.length ? { ok: true, text: '+2 🥐' } : { ok: false, text: t('Aucun vote', 'No votes') }}>
        <div className="ticket-ask">{t('Meilleure réponse', 'Best answer')}</div>
        <h3 className="ticket-q">{winners.length ? winners.map((w) => w.name).join(t(' et ', ' and ')) : t('Personne…', 'Nobody…')}</h3>
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
